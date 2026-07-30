import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import { testPlanSchema, validate } from '../validation/schemas.js';

const testCaseInclude = {
  suite: {
    select: { id: true, name: true, projectId: true }
  },
  testSteps: {
    orderBy: { position: 'asc' }
  },
  components: {
    orderBy: {
      component: {
        position: 'asc'
      }
    },
    include: {
      component: true
    }
  }
};

const planInclude = {
  sections: {
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: {
      items: {
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: {
          testCase: {
            include: testCaseInclude
          }
        }
      }
    }
  },
  _count: {
    select: { runs: true }
  }
};

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.status = 409;
  throw error;
}

function serializeCase(testCase) {
  return {
    ...testCase,
    components: (testCase.components || []).map((association) => association.component)
  };
}

function serializePlan(plan) {
  const sections = plan.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      testCase: serializeCase(item.testCase)
    }))
  }));

  return {
    ...plan,
    sections,
    items: sections.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        sectionId: section.id,
        sectionName: section.name,
        sectionPosition: section.position
      }))
    )
  };
}

function normalizePlanStructure(data) {
  if (data.sections) {
    return data.sections;
  }

  return [
    {
      key: 'default',
      name: 'Casos do plano',
      description: null,
      items: (data.testCaseIds || []).map((testCaseId, index) => ({
        key: `legacy-${index + 1}`,
        testCaseId,
        transitionInstructions: null,
        dependsOnItemKey: null
      }))
    }
  ];
}

async function ensureProject(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true }
  });

  if (!project) {
    const error = new Error('Projeto nao encontrado');
    error.status = 404;
    throw error;
  }
}

async function ensureUniquePlanName(projectId, name, ignoredId) {
  const plans = await prisma.testPlan.findMany({
    where: { projectId },
    select: { id: true, name: true }
  });
  const normalizedName = name.toLocaleLowerCase('pt-BR');

  if (
    plans.some(
      (plan) =>
        plan.id !== ignoredId && plan.name.toLocaleLowerCase('pt-BR') === normalizedName
    )
  ) {
    conflict('Ja existe um plano com este nome no projeto');
  }
}

async function validatePlanCases(projectId, sections) {
  const testCaseIds = [
    ...new Set(
      sections.flatMap((section) => section.items.map((item) => item.testCaseId))
    )
  ];

  if (!testCaseIds.length) {
    return;
  }

  const count = await prisma.testCase.count({
    where: {
      id: { in: testCaseIds },
      suite: { projectId }
    }
  });

  if (count !== testCaseIds.length) {
    throw validationError('Um ou mais casos nao pertencem ao projeto');
  }
}

async function createPlanHierarchy(transaction, testPlanId, sections) {
  const itemIdsByKey = new Map();
  const pendingDependencies = [];

  for (const [sectionIndex, section] of sections.entries()) {
    const createdSection = await transaction.testPlanSection.create({
      data: {
        testPlanId,
        name: section.name,
        description: section.description,
        position: sectionIndex + 1
      }
    });

    for (const [itemIndex, item] of section.items.entries()) {
      const createdItem = await transaction.testPlanItem.create({
        data: {
          testPlanId,
          sectionId: createdSection.id,
          testCaseId: item.testCaseId,
          position: itemIndex + 1,
          transitionInstructions: item.transitionInstructions
        },
        select: { id: true }
      });
      itemIdsByKey.set(item.key, createdItem.id);

      if (item.dependsOnItemKey) {
        pendingDependencies.push({
          itemId: createdItem.id,
          dependsOnItemKey: item.dependsOnItemKey
        });
      }
    }
  }

  for (const dependency of pendingDependencies) {
    const dependsOnItemId = itemIdsByKey.get(dependency.dependsOnItemKey);

    if (!dependsOnItemId) {
      throw validationError('A dependencia deve apontar para um item anterior');
    }

    await transaction.testPlanItem.update({
      where: { id: dependency.itemId },
      data: { dependsOnItemId }
    });
  }
}

export async function listTestPlans(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    const plans = await prisma.testPlan.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: planInclude
    });

    res.json(plans.map(serializePlan));
  } catch (error) {
    sendError(res, error);
  }
}

export async function getTestPlan(req, res) {
  try {
    const id = parseId(req.params.id);
    const plan = await prisma.testPlan.findUnique({
      where: { id },
      include: planInclude
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plano nao encontrado' });
    }

    res.json(serializePlan(plan));
  } catch (error) {
    sendError(res, error);
  }
}

export async function createTestPlan(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(testPlanSchema, req.body);
    const sections = normalizePlanStructure(data);
    await ensureProject(projectId);
    await ensureUniquePlanName(projectId, data.name);
    await validatePlanCases(projectId, sections);

    const planId = await prisma.$transaction(async (transaction) => {
      const plan = await transaction.testPlan.create({
        data: {
          projectId,
          name: data.name,
          description: data.description
        },
        select: { id: true }
      });
      await createPlanHierarchy(transaction, plan.id, sections);
      return plan.id;
    });
    const plan = await prisma.testPlan.findUnique({
      where: { id: planId },
      include: planInclude
    });

    res.status(201).json(serializePlan(plan));
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateTestPlan(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(testPlanSchema, req.body);
    const sections = normalizePlanStructure(data);
    const existingPlan = await prisma.testPlan.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    });

    if (!existingPlan) {
      return res.status(404).json({ error: 'Plano nao encontrado' });
    }

    await ensureUniquePlanName(existingPlan.projectId, data.name, id);
    await validatePlanCases(existingPlan.projectId, sections);

    await prisma.$transaction(async (transaction) => {
      await transaction.testPlanSection.deleteMany({ where: { testPlanId: id } });
      await transaction.testPlan.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description
        }
      });
      await createPlanHierarchy(transaction, id, sections);
    });

    const plan = await prisma.testPlan.findUnique({
      where: { id },
      include: planInclude
    });
    res.json(serializePlan(plan));
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteTestPlan(req, res) {
  try {
    const id = parseId(req.params.id);
    const existingPlan = await prisma.testPlan.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingPlan) {
      return res.status(404).json({ error: 'Plano nao encontrado' });
    }

    await prisma.testPlan.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}
