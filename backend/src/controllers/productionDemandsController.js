import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import {
  productionDemandAdClosureSchema,
  productionDemandCreateSchema,
  productionDemandFilterSchema,
  productionDemandMfClosureSchema,
  productionDemandNoteSchema,
  productionDemandReopenSchema,
  productionDemandUpdateSchema,
  validate
} from '../validation/schemas.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = ['Open', 'InProgress', 'Waiting'];

const demandListInclude = {
  validationBrief: {
    select: { id: true, title: true, status: true }
  },
  run: {
    select: { id: true, name: true, status: true }
  },
  milestone: {
    select: { id: true, name: true, status: true }
  },
  linkedAd: {
    select: { id: true, type: true, code: true, title: true, status: true }
  },
  _count: {
    select: { relatedMfs: true, activities: true }
  }
};

const demandDetailInclude = {
  ...demandListInclude,
  relatedMfs: {
    orderBy: [{ status: 'asc' }, { code: 'asc' }],
    select: { id: true, type: true, code: true, title: true, status: true }
  },
  activities: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  }
};

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function normalizeCode(value) {
  return value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function utcDay(value = new Date()) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addCalendarDays(value, days) {
  const result = utcDay(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function sameValue(left, right) {
  if (left instanceof Date || right instanceof Date) {
    if (!left || !right) {
      return left === right;
    }

    return new Date(left).getTime() === new Date(right).getTime();
  }

  return (left ?? null) === (right ?? null);
}

function dateLabel(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : 'Sem data';
}

function deadlineContext(demand, now = new Date()) {
  if (demand.status === 'Closed') {
    return {
      deadlineState: 'Closed',
      daysRemaining: null,
      daysOverdue: 0
    };
  }

  if (!demand.dueDate) {
    return {
      deadlineState: 'NoDate',
      daysRemaining: null,
      daysOverdue: 0
    };
  }

  const difference = Math.round((utcDay(demand.dueDate) - utcDay(now)) / DAY_MS);

  if (difference < 0) {
    return {
      deadlineState: 'Overdue',
      daysRemaining: difference,
      daysOverdue: Math.abs(difference)
    };
  }

  return {
    deadlineState: difference === 0 ? 'DueToday' : 'OnTrack',
    daysRemaining: difference,
    daysOverdue: 0
  };
}

function serializeDemand(demand) {
  return {
    ...demand,
    ...deadlineContext(demand)
  };
}

function operationalRank(demand) {
  const { deadlineState } = deadlineContext(demand);

  if (demand.status === 'Closed') {
    return 3;
  }

  if (deadlineState === 'Overdue') {
    return 0;
  }

  if (demand.dueDate) {
    return 1;
  }

  return 2;
}

function sortOperationally(left, right) {
  const rankDifference = operationalRank(left) - operationalRank(right);

  if (rankDifference !== 0) {
    return rankDifference;
  }

  const leftDate = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const rightDate = right.dueDate
    ? new Date(right.dueDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  const updatedDifference =
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();

  return updatedDifference || left.id - right.id;
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

async function getDemand(id) {
  return prisma.productionDemand.findUnique({
    where: { id },
    include: demandDetailInclude
  });
}

async function ensureRelations(projectId, type, data, demandId) {
  const [validationBrief, run, milestone, linkedAd] = await Promise.all([
    data.validationBriefId
      ? prisma.validationBrief.findUnique({
          where: { id: data.validationBriefId },
          select: { id: true, projectId: true, title: true }
        })
      : null,
    data.runId
      ? prisma.run.findUnique({
          where: { id: data.runId },
          select: { id: true, projectId: true, name: true }
        })
      : null,
    data.milestoneId
      ? prisma.milestone.findUnique({
          where: { id: data.milestoneId },
          select: { id: true, projectId: true, name: true }
        })
      : null,
    data.linkedAdId
      ? prisma.productionDemand.findUnique({
          where: { id: data.linkedAdId },
          select: { id: true, projectId: true, type: true, code: true, title: true }
        })
      : null
  ]);

  if (
    (data.validationBriefId && validationBrief?.projectId !== projectId) ||
    (data.runId && run?.projectId !== projectId) ||
    (data.milestoneId && milestone?.projectId !== projectId)
  ) {
    fail('Um ou mais vinculos nao pertencem ao projeto');
  }

  if (data.linkedAdId) {
    if (
      type !== 'MF' ||
      !linkedAd ||
      linkedAd.projectId !== projectId ||
      linkedAd.type !== 'AD' ||
      linkedAd.id === demandId
    ) {
      fail('Selecione uma AD valida do mesmo projeto');
    }
  }

  return { validationBrief, run, milestone, linkedAd };
}

function persistenceData(data) {
  return {
    code: data.code,
    normalizedCode: normalizeCode(data.code),
    sourceUrl: data.sourceUrl,
    title: data.title,
    description: data.description,
    supportContact: data.supportContact,
    qaOwner: data.qaOwner,
    registeredAt: utcDay(data.registeredAt),
    dueDate: data.type === 'MF' ? addCalendarDays(data.registeredAt, 20) : data.dueDate,
    criticality: data.type === 'AD' ? data.criticality : null,
    affectedUsersCount: data.type === 'AD' ? data.affectedUsersCount : null,
    validationBriefId: data.validationBriefId || null,
    runId: data.runId || null,
    milestoneId: data.milestoneId || null,
    linkedAdId: data.type === 'MF' ? data.linkedAdId || null : null
  };
}

function changedFieldLabels(existing, data, persisted) {
  const fields = [
    ['code', 'codigo', data.code],
    ['sourceUrl', 'link de origem', data.sourceUrl],
    ['title', 'titulo', data.title],
    ['description', 'descricao', data.description],
    ['supportContact', 'contato do suporte', data.supportContact],
    ['qaOwner', 'responsavel de QA', data.qaOwner],
    ['registeredAt', 'data de registro', persisted.registeredAt],
    ['criticality', 'criticidade', persisted.criticality],
    ['affectedUsersCount', 'quantidade afetada', persisted.affectedUsersCount]
  ];

  return fields
    .filter(([key, , value]) => !sameValue(existing[key], value))
    .map(([, label]) => label);
}

function linkActivityMessages(existing, persisted, relations) {
  const definitions = [
    {
      key: 'validationBriefId',
      label: 'ficha',
      previous: existing.validationBrief?.title,
      next: relations.validationBrief?.title
    },
    {
      key: 'runId',
      label: 'run',
      previous: existing.run?.name,
      next: relations.run?.name
    },
    {
      key: 'milestoneId',
      label: 'milestone',
      previous: existing.milestone?.name,
      next: relations.milestone?.name
    },
    {
      key: 'linkedAdId',
      label: 'AD definitiva',
      previous: existing.linkedAd
        ? `${existing.linkedAd.code} - ${existing.linkedAd.title}`
        : null,
      next: relations.linkedAd ? `${relations.linkedAd.code} - ${relations.linkedAd.title}` : null
    }
  ];

  return definitions
    .filter(({ key }) => !sameValue(existing[key], persisted[key]))
    .map(({ label, previous, next }) => ({
      kind: 'LinkChanged',
      message: next
        ? `${label} vinculada: ${next}.`
        : `${label} removida${previous ? `: ${previous}` : ''}.`
    }));
}

function handleControllerError(res, error) {
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'Ja existe uma demanda com este codigo e tipo' });
  }

  sendError(res, error);
}

export async function listProductionDemands(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const filters = validate(productionDemandFilterSchema, req.query);
    await ensureProject(projectId);
    const demands = await prisma.productionDemand.findMany({
      where: {
        projectId,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.criticality ? { criticality: filters.criticality } : {}),
        ...(filters.qaOwner
          ? { qaOwner: { contains: filters.qaOwner } }
          : {}),
        ...(filters.q
          ? {
              OR: [
                { code: { contains: filters.q } },
                { title: { contains: filters.q } },
                { description: { contains: filters.q } },
                { supportContact: { contains: filters.q } },
                { qaOwner: { contains: filters.q } }
              ]
            }
          : {})
      },
      include: demandListInclude
    });
    const serialized = demands
      .sort(sortOperationally)
      .map(serializeDemand)
      .filter(
        (demand) =>
          !filters.deadlineState || demand.deadlineState === filters.deadlineState
      );

    res.json(serialized);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getProductionDemandSummary(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    const demands = await prisma.productionDemand.findMany({
      where: { projectId },
      select: { id: true, type: true, status: true, criticality: true, dueDate: true }
    });
    const active = demands.filter((demand) => demand.status !== 'Closed');

    res.json({
      total: demands.length,
      active: active.length,
      overdue: active.filter(
        (demand) => deadlineContext(demand).deadlineState === 'Overdue'
      ).length,
      noDate: active.filter((demand) => !demand.dueDate).length,
      highCriticality: active.filter(
        (demand) => demand.type === 'AD' && demand.criticality === 'High'
      ).length,
      closed: demands.length - active.length
    });
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getProductionDemand(req, res) {
  try {
    const id = parseId(req.params.id);
    const demand = await getDemand(id);

    if (!demand) {
      return res.status(404).json({ error: 'Demanda nao encontrada' });
    }

    res.json(serializeDemand(demand));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function createProductionDemand(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(productionDemandCreateSchema, req.body);
    await ensureProject(projectId);
    const relations = await ensureRelations(projectId, data.type, data);
    const persisted = persistenceData(data);
    const initialLinkActivities = [
      relations.validationBrief
        ? `ficha vinculada: ${relations.validationBrief.title}.`
        : null,
      relations.run ? `run vinculado: ${relations.run.name}.` : null,
      relations.milestone
        ? `milestone vinculado: ${relations.milestone.name}.`
        : null,
      relations.linkedAd
        ? `AD definitiva vinculada: ${relations.linkedAd.code} - ${relations.linkedAd.title}.`
        : null
    ].filter(Boolean);
    const demandId = await prisma.$transaction(async (transaction) => {
      const demand = await transaction.productionDemand.create({
        data: {
          projectId,
          type: data.type,
          status: 'Open',
          ...persisted
        },
        select: { id: true }
      });
      await transaction.productionDemandActivity.create({
        data: {
          demandId: demand.id,
          kind: 'Created',
          message: `${data.type} ${data.code} criada com estado Aberta.`,
          nextState: 'Open'
        }
      });
      for (const message of initialLinkActivities) {
        await transaction.productionDemandActivity.create({
          data: {
            demandId: demand.id,
            kind: 'LinkChanged',
            message
          }
        });
      }
      return demand.id;
    });
    const demand = await getDemand(demandId);

    res.status(201).json(serializeDemand(demand));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateProductionDemand(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(productionDemandUpdateSchema, req.body);
    const existing = await getDemand(id);

    if (!existing) {
      return res.status(404).json({ error: 'Demanda nao encontrada' });
    }

    if (existing.status === 'Closed') {
      fail('Reabra a demanda antes de editar');
    }

    if (existing.type !== data.type) {
      fail('O tipo da demanda nao pode ser alterado');
    }

    const relations = await ensureRelations(existing.projectId, data.type, data, id);
    const persisted = persistenceData(data);
    const changedFields = changedFieldLabels(existing, data, persisted);
    const linkActivities = linkActivityMessages(existing, persisted, relations);
    const statusChanged = existing.status !== data.status;
    const deadlineChanged = !sameValue(existing.dueDate, persisted.dueDate);

    await prisma.$transaction(async (transaction) => {
      await transaction.productionDemand.update({
        where: { id },
        data: {
          ...persisted,
          status: data.status
        }
      });

      if (changedFields.length > 0) {
        await transaction.productionDemandActivity.create({
          data: {
            demandId: id,
            kind: 'Updated',
            message: `Campos atualizados: ${changedFields.join(', ')}.`
          }
        });
      }

      if (deadlineChanged) {
        await transaction.productionDemandActivity.create({
          data: {
            demandId: id,
            kind: 'DeadlineChanged',
            message: `Prazo atualizado para ${dateLabel(persisted.dueDate)}.`
          }
        });
      }

      if (statusChanged) {
        await transaction.productionDemandActivity.create({
          data: {
            demandId: id,
            kind: 'StatusChanged',
            message: `Estado alterado de ${existing.status} para ${data.status}.`,
            previousState: existing.status,
            nextState: data.status
          }
        });
      }

      for (const activity of linkActivities) {
        await transaction.productionDemandActivity.create({
          data: { demandId: id, ...activity }
        });
      }
    });
    const demand = await getDemand(id);

    res.json(serializeDemand(demand));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteProductionDemand(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.productionDemand.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Demanda nao encontrada' });
    }

    if (existing.status === 'Closed') {
      fail('Reabra a demanda antes de excluir');
    }

    await prisma.productionDemand.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function closeProductionDemand(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.productionDemand.findUnique({
      where: { id },
      select: { id: true, type: true, status: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Demanda nao encontrada' });
    }

    if (existing.status === 'Closed') {
      fail('A demanda ja esta encerrada');
    }

    const data =
      existing.type === 'MF'
        ? validate(productionDemandMfClosureSchema, req.body)
        : validate(productionDemandAdClosureSchema, req.body);
    const closedAt = new Date();

    await prisma.$transaction(async (transaction) => {
      await transaction.productionDemand.update({
        where: { id },
        data:
          existing.type === 'MF'
            ? {
                status: 'Closed',
                workaroundSummary: data.workaroundSummary,
                workaroundDeliveredAt: utcDay(data.workaroundDeliveredAt),
                closureReason: data.closureReason,
                closedAt
              }
            : {
                status: 'Closed',
                resolutionSummary: data.resolutionSummary,
                productionVersion: data.productionVersion,
                productionReleasedAt: utcDay(data.productionReleasedAt),
                closureReason: data.closureReason,
                closedAt
              }
      });
      await transaction.productionDemandActivity.create({
        data: {
          demandId: id,
          kind: 'Closed',
          message:
            existing.type === 'MF'
              ? `MF encerrado com solucao paliativa entregue em ${dateLabel(data.workaroundDeliveredAt)}.`
              : `AD encerrada com correcao em producao em ${dateLabel(data.productionReleasedAt)}.`,
          previousState: existing.status,
          nextState: 'Closed'
        }
      });
    });
    const demand = await getDemand(id);

    res.json(serializeDemand(demand));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function reopenProductionDemand(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(productionDemandReopenSchema, req.body);
    const existing = await prisma.productionDemand.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Demanda nao encontrada' });
    }

    if (existing.status !== 'Closed') {
      fail('Somente uma demanda encerrada pode ser reaberta');
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.productionDemand.update({
        where: { id },
        data: { status: 'InProgress' }
      });
      await transaction.productionDemandActivity.create({
        data: {
          demandId: id,
          kind: 'Reopened',
          message: `Demanda reaberta: ${data.reason}`,
          previousState: 'Closed',
          nextState: 'InProgress'
        }
      });
    });
    const demand = await getDemand(id);

    res.json(serializeDemand(demand));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function createProductionDemandNote(req, res) {
  try {
    const demandId = parseId(req.params.id);
    const data = validate(productionDemandNoteSchema, req.body);
    const demand = await prisma.productionDemand.findUnique({
      where: { id: demandId },
      select: { id: true }
    });

    if (!demand) {
      return res.status(404).json({ error: 'Demanda nao encontrada' });
    }

    const activity = await prisma.productionDemandActivity.create({
      data: {
        demandId,
        kind: 'Note',
        message: data.content,
        author: data.author
      }
    });
    res.status(201).json(activity);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteProductionDemandNote(req, res) {
  try {
    const id = parseId(req.params.id);
    const activity = await prisma.productionDemandActivity.findUnique({
      where: { id },
      include: {
        demand: {
          select: { id: true, status: true }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Atividade nao encontrada' });
    }

    if (activity.kind !== 'Note') {
      fail('Atividades do sistema nao podem ser excluidas');
    }

    if (activity.demand.status === 'Closed') {
      fail('Reabra a demanda antes de excluir uma anotacao');
    }

    await prisma.productionDemandActivity.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
}

export const productionDemandInternals = {
  ACTIVE_STATUSES,
  addCalendarDays,
  deadlineContext,
  normalizeCode,
  sortOperationally
};
