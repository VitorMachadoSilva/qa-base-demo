import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import { testComponentSchema, validate } from '../validation/schemas.js';

function normalizeComponentName(name) {
  return name.normalize('NFKC').trim().toLocaleLowerCase('pt-BR');
}

function conflict(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
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

export async function listTestComponents(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    const components = await prisma.testComponent.findMany({
      where: { projectId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      include: {
        _count: {
          select: { testCases: true }
        }
      }
    });

    res.json(components);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createTestComponent(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(testComponentSchema, req.body);
    await ensureProject(projectId);

    const lastComponent = await prisma.testComponent.findFirst({
      where: { projectId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    const component = await prisma.testComponent.create({
      data: {
        projectId,
        name: data.name,
        normalizedName: normalizeComponentName(data.name),
        description: data.description,
        position: (lastComponent?.position || 0) + 1
      },
      include: {
        _count: {
          select: { testCases: true }
        }
      }
    });

    res.status(201).json(component);
  } catch (error) {
    if (error.code === 'P2002') {
      error = conflict('Ja existe um componente com este nome no projeto');
    }
    sendError(res, error);
  }
}

export async function updateTestComponent(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(testComponentSchema, req.body);
    const existing = await prisma.testComponent.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Componente nao encontrado' });
    }

    const componentCount = await prisma.testComponent.count({
      where: { projectId: existing.projectId }
    });
    const nextPosition = Math.min(data.position || existing.position, componentCount);

    await prisma.$transaction(async (transaction) => {
      if (nextPosition !== existing.position) {
        const orderedComponents = await transaction.testComponent.findMany({
          where: { projectId: existing.projectId },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          select: { id: true }
        });
        const reorderedIds = orderedComponents
          .map((component) => component.id)
          .filter((componentId) => componentId !== id);
        reorderedIds.splice(nextPosition - 1, 0, id);

        for (const [index, componentId] of reorderedIds.entries()) {
          await transaction.testComponent.update({
            where: { id: componentId },
            data: { position: -(index + 1) }
          });
        }

        for (const [index, componentId] of reorderedIds.entries()) {
          await transaction.testComponent.update({
            where: { id: componentId },
            data: { position: index + 1 }
          });
        }
      }

      await transaction.testComponent.update({
        where: { id },
        data: {
          name: data.name,
          normalizedName: normalizeComponentName(data.name),
          description: data.description,
          position: nextPosition
        }
      });
    });

    const component = await prisma.testComponent.findUnique({
      where: { id },
      include: {
        _count: {
          select: { testCases: true }
        }
      }
    });
    res.json(component);
  } catch (error) {
    if (error.code === 'P2002') {
      error = conflict('Ja existe um componente com este nome no projeto');
    }
    sendError(res, error);
  }
}

export async function deleteTestComponent(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.testComponent.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Componente nao encontrado' });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.testComponent.delete({ where: { id } });
      await transaction.testComponent.updateMany({
        where: {
          projectId: existing.projectId,
          position: { gt: existing.position }
        },
        data: { position: { decrement: 1 } }
      });
    });

    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}
