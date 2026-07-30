import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import {
  configurationGroupSchema,
  configurationOptionSchema,
  environmentSchema,
  milestoneSchema,
  validate
} from '../validation/schemas.js';

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

async function ensureProject(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true }
  });

  if (!project) {
    fail('Projeto nao encontrado', 404);
  }
}

async function ensureUniqueName(model, where, name, ignoredId, message) {
  const records = await model.findMany({
    where,
    select: { id: true, name: true }
  });
  const normalizedName = name.toLocaleLowerCase('pt-BR');

  if (
    records.some(
      (record) =>
        record.id !== ignoredId &&
        record.name.toLocaleLowerCase('pt-BR') === normalizedName
    )
  ) {
    fail(message, 409);
  }
}

function summarizeRuns(runs) {
  const summary = {
    totalRuns: runs.length,
    activeRuns: 0,
    completedRuns: 0,
    totalCases: 0,
    executed: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: 0,
    completionPercentage: 0
  };

  runs.forEach((run) => {
    if (run.status === 'Completed') {
      summary.completedRuns += 1;
    } else {
      summary.activeRuns += 1;
    }

    run.runTestCases.forEach((item) => {
      summary.totalCases += 1;
      const key = item.status.toLowerCase();

      if (key in summary) {
        summary[key] += 1;
      }
    });
  });

  summary.executed = summary.totalCases - summary.untested;
  summary.completionPercentage = summary.totalCases
    ? Math.round((summary.executed / summary.totalCases) * 100)
    : 0;

  return summary;
}

const milestoneInclude = {
  runs: {
    select: {
      status: true,
      runTestCases: {
        select: { status: true }
      }
    }
  }
};

function serializeMilestone(milestone) {
  const { runs, ...data } = milestone;
  return {
    ...data,
    summary: summarizeRuns(runs)
  };
}

export async function listMilestones(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      include: milestoneInclude
    });
    res.json(milestones.map(serializeMilestone));
  } catch (error) {
    sendError(res, error);
  }
}

export async function getMilestone(req, res) {
  try {
    const id = parseId(req.params.id);
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: milestoneInclude
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone nao encontrado' });
    }

    res.json(serializeMilestone(milestone));
  } catch (error) {
    sendError(res, error);
  }
}

export async function createMilestone(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(milestoneSchema, req.body);
    await ensureProject(projectId);
    await ensureUniqueName(
      prisma.milestone,
      { projectId },
      data.name,
      undefined,
      'Ja existe um milestone com este nome no projeto'
    );
    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        ...data,
        completedAt: data.status === 'Completed' ? new Date() : null
      },
      include: milestoneInclude
    });
    res.status(201).json(serializeMilestone(milestone));
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateMilestone(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(milestoneSchema, req.body);
    const existing = await prisma.milestone.findUnique({
      where: { id },
      select: { id: true, projectId: true, completedAt: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Milestone nao encontrado' });
    }

    await ensureUniqueName(
      prisma.milestone,
      { projectId: existing.projectId },
      data.name,
      id,
      'Ja existe um milestone com este nome no projeto'
    );
    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...data,
        completedAt:
          data.status === 'Completed' ? existing.completedAt || new Date() : null
      },
      include: milestoneInclude
    });
    res.json(serializeMilestone(milestone));
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteMilestone(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.milestone.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Milestone nao encontrado' });
    }

    await prisma.milestone.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

export async function listEnvironments(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    const environments = await prisma.environment.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { runs: true }
        }
      }
    });
    res.json(environments);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createEnvironment(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(environmentSchema, req.body);
    await ensureProject(projectId);
    await ensureUniqueName(
      prisma.environment,
      { projectId },
      data.name,
      undefined,
      'Ja existe um ambiente com este nome no projeto'
    );
    const environment = await prisma.environment.create({
      data: { projectId, ...data },
      include: { _count: { select: { runs: true } } }
    });
    res.status(201).json(environment);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateEnvironment(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(environmentSchema, req.body);
    const existing = await prisma.environment.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Ambiente nao encontrado' });
    }

    await ensureUniqueName(
      prisma.environment,
      { projectId: existing.projectId },
      data.name,
      id,
      'Ja existe um ambiente com este nome no projeto'
    );
    const environment = await prisma.environment.update({
      where: { id },
      data,
      include: { _count: { select: { runs: true } } }
    });
    res.json(environment);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteEnvironment(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.environment.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Ambiente nao encontrado' });
    }

    await prisma.environment.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

const configurationInclude = {
  options: {
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    include: {
      _count: {
        select: { runConfigurations: true }
      }
    }
  }
};

export async function listConfigurationGroups(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    const groups = await prisma.configurationGroup.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: configurationInclude
    });
    res.json(groups);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createConfigurationGroup(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(configurationGroupSchema, req.body);
    await ensureProject(projectId);
    await ensureUniqueName(
      prisma.configurationGroup,
      { projectId },
      data.name,
      undefined,
      'Ja existe um grupo com este nome no projeto'
    );
    const count = await prisma.configurationGroup.count({ where: { projectId } });
    const group = await prisma.configurationGroup.create({
      data: {
        projectId,
        name: data.name,
        position: count + 1
      },
      include: configurationInclude
    });
    res.status(201).json(group);
  } catch (error) {
    sendError(res, error);
  }
}

async function reorderConfigurationGroups(transaction, projectId, groupId, position) {
  const groups = await transaction.configurationGroup.findMany({
    where: { projectId },
    orderBy: { position: 'asc' },
    select: { id: true }
  });
  const orderedIds = groups.map((group) => group.id).filter((id) => id !== groupId);
  const targetIndex = Math.max(0, Math.min(position - 1, orderedIds.length));
  orderedIds.splice(targetIndex, 0, groupId);

  for (const [index, id] of orderedIds.entries()) {
    await transaction.configurationGroup.update({
      where: { id },
      data: { position: -(index + 1) }
    });
  }

  for (const [index, id] of orderedIds.entries()) {
    await transaction.configurationGroup.update({
      where: { id },
      data: { position: index + 1 }
    });
  }
}

export async function updateConfigurationGroup(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(configurationGroupSchema, req.body);
    const existing = await prisma.configurationGroup.findUnique({
      where: { id },
      select: { id: true, projectId: true, position: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Grupo de configuracao nao encontrado' });
    }

    await ensureUniqueName(
      prisma.configurationGroup,
      { projectId: existing.projectId },
      data.name,
      id,
      'Ja existe um grupo com este nome no projeto'
    );
    await prisma.$transaction(async (transaction) => {
      await transaction.configurationGroup.update({
        where: { id },
        data: { name: data.name }
      });

      if (data.position && data.position !== existing.position) {
        await reorderConfigurationGroups(
          transaction,
          existing.projectId,
          id,
          data.position
        );
      }
    });
    const group = await prisma.configurationGroup.findUnique({
      where: { id },
      include: configurationInclude
    });
    res.json(group);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteConfigurationGroup(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.configurationGroup.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Grupo de configuracao nao encontrado' });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.configurationGroup.delete({ where: { id } });
      const remaining = await transaction.configurationGroup.findMany({
        where: { projectId: existing.projectId },
        orderBy: { position: 'asc' },
        select: { id: true }
      });

      for (const [index, group] of remaining.entries()) {
        await transaction.configurationGroup.update({
          where: { id: group.id },
          data: { position: index + 1 }
        });
      }
    });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

export async function createConfigurationOption(req, res) {
  try {
    const groupId = parseId(req.params.groupId, 'groupId');
    const data = validate(configurationOptionSchema, req.body);
    const group = await prisma.configurationGroup.findUnique({
      where: { id: groupId },
      select: { id: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo de configuracao nao encontrado' });
    }

    await ensureUniqueName(
      prisma.configurationOption,
      { groupId },
      data.name,
      undefined,
      'Ja existe uma opcao com este nome no grupo'
    );
    const option = await prisma.configurationOption.create({
      data: { groupId, name: data.name },
      include: { _count: { select: { runConfigurations: true } } }
    });
    res.status(201).json(option);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateConfigurationOption(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(configurationOptionSchema, req.body);
    const existing = await prisma.configurationOption.findUnique({
      where: { id },
      select: { id: true, groupId: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Opcao de configuracao nao encontrada' });
    }

    await ensureUniqueName(
      prisma.configurationOption,
      { groupId: existing.groupId },
      data.name,
      id,
      'Ja existe uma opcao com este nome no grupo'
    );
    const option = await prisma.configurationOption.update({
      where: { id },
      data,
      include: { _count: { select: { runConfigurations: true } } }
    });
    res.json(option);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteConfigurationOption(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.configurationOption.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Opcao de configuracao nao encontrada' });
    }

    await prisma.configurationOption.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}
