import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import {
  thirdPartyCloseSchema,
  thirdPartyCreateSchema,
  thirdPartyFilterSchema,
  thirdPartyNoteSchema,
  thirdPartyRenewSchema,
  thirdPartyUpdateSchema,
  validate
} from '../validation/schemas.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const detailInclude = {
  cycles: {
    orderBy: [{ approvedAt: 'desc' }, { id: 'desc' }],
    include: {
      grants: {
        orderBy: { system: 'asc' }
      }
    }
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

function normalizeText(value) {
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

function addCalendarMonths(value, months) {
  const source = utcDay(value);
  const targetMonth = source.getUTCMonth() + months;
  const targetYear = source.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();

  return new Date(
    Date.UTC(targetYear, normalizedMonth, Math.min(source.getUTCDate(), lastDay))
  );
}

function cycleDates(data) {
  const approvedAt = utcDay(data.approvedAt);
  const maximumExpiry = addCalendarMonths(approvedAt, 3);
  const expiresAt = data.expiresAt ? utcDay(data.expiresAt) : maximumExpiry;

  if (expiresAt < approvedAt) {
    fail('O vencimento nao pode ser anterior a aprovacao');
  }

  if (expiresAt > maximumExpiry) {
    fail('O vencimento nao pode ultrapassar tres meses apos a aprovacao');
  }

  return { approvedAt, expiresAt, maximumExpiry };
}

function accessState(cycle, now = new Date()) {
  if (!cycle || cycle.closedAt) {
    return {
      state: 'Closed',
      daysRemaining: null,
      daysOverdue: 0
    };
  }

  const difference = Math.round((utcDay(cycle.expiresAt) - utcDay(now)) / DAY_MS);

  if (difference < 0) {
    return {
      state: 'Expired',
      daysRemaining: difference,
      daysOverdue: Math.abs(difference)
    };
  }

  return {
    state: difference <= 7 ? 'Expiring' : 'Active',
    daysRemaining: difference,
    daysOverdue: 0
  };
}

function serializeThirdParty(thirdParty) {
  const currentCycle =
    thirdParty.cycles.find((cycle) => !cycle.closedAt) || thirdParty.cycles[0] || null;

  return {
    ...thirdParty,
    currentCycle,
    systems: currentCycle?.grants.map((grant) => grant.system) || [],
    ...accessState(currentCycle)
  };
}

function operationalRank(record) {
  return {
    Expired: 0,
    Expiring: 1,
    Active: 2,
    Closed: 3
  }[record.state];
}

function sortOperationally(left, right) {
  const rankDifference = operationalRank(left) - operationalRank(right);

  if (rankDifference !== 0) {
    return rankDifference;
  }

  const leftDate = left.currentCycle?.expiresAt
    ? new Date(left.currentCycle.expiresAt).getTime()
    : Number.MAX_SAFE_INTEGER;
  const rightDate = right.currentCycle?.expiresAt
    ? new Date(right.currentCycle.expiresAt).getTime()
    : Number.MAX_SAFE_INTEGER;

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  return left.name.localeCompare(right.name, 'pt-BR') || left.id - right.id;
}

function identityData(data) {
  return {
    name: data.name,
    normalizedName: normalizeText(data.name),
    company: data.company,
    normalizedCompany: normalizeText(data.company),
    role: data.role,
    contact: data.contact,
    internalOwner: data.internalOwner,
    notes: data.notes
  };
}

function changedFieldLabels(existing, data) {
  const fields = [
    ['name', 'nome'],
    ['company', 'empresa'],
    ['role', 'funcao'],
    ['contact', 'contato'],
    ['internalOwner', 'responsavel interno'],
    ['notes', 'observacoes']
  ];

  return fields
    .filter(([key]) => (existing[key] ?? null) !== (data[key] ?? null))
    .map(([, label]) => label);
}

async function getThirdPartyRecord(id) {
  return prisma.thirdParty.findUnique({
    where: { id },
    include: detailInclude
  });
}

function handleControllerError(res, error) {
  if (error.code === 'P2002') {
    return res
      .status(409)
      .json({ error: 'Ja existe um terceiro com este nome e empresa' });
  }

  sendError(res, error);
}

export async function listThirdParties(req, res) {
  try {
    const filters = validate(thirdPartyFilterSchema, req.query);
    const thirdParties = await prisma.thirdParty.findMany({
      where: { archivedAt: null },
      include: {
        cycles: {
          orderBy: [{ approvedAt: 'desc' }, { id: 'desc' }],
          include: { grants: true }
        }
      }
    });
    const query = filters.q?.toLocaleLowerCase('pt-BR');
    const company = filters.company?.toLocaleLowerCase('pt-BR');
    const internalOwner = filters.internalOwner?.toLocaleLowerCase('pt-BR');
    const records = thirdParties
      .map(serializeThirdParty)
      .filter((record) => {
        const searchable = [
          record.name,
          record.company,
          record.role,
          record.contact,
          record.internalOwner
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('pt-BR');

        return (
          (!query || searchable.includes(query)) &&
          (!filters.state || record.state === filters.state) &&
          (!filters.system || record.systems.includes(filters.system)) &&
          (!company || record.company.toLocaleLowerCase('pt-BR').includes(company)) &&
          (!internalOwner ||
            record.internalOwner.toLocaleLowerCase('pt-BR').includes(internalOwner))
        );
      })
      .sort(sortOperationally);

    res.json(records);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getThirdPartySummary(req, res) {
  try {
    const thirdParties = await prisma.thirdParty.findMany({
      where: { archivedAt: null },
      include: {
        cycles: {
          orderBy: [{ approvedAt: 'desc' }, { id: 'desc' }],
          include: { grants: true }
        }
      }
    });
    const records = thirdParties.map(serializeThirdParty);

    res.json({
      total: records.length,
      active: records.filter((record) => record.state === 'Active').length,
      expiring: records.filter((record) => record.state === 'Expiring').length,
      expired: records.filter((record) => record.state === 'Expired').length,
      closed: records.filter((record) => record.state === 'Closed').length
    });
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getThirdParty(req, res) {
  try {
    const id = parseId(req.params.id);
    const thirdParty = await getThirdPartyRecord(id);

    if (!thirdParty || thirdParty.archivedAt) {
      return res.status(404).json({ error: 'Terceiro nao encontrado' });
    }

    res.json(serializeThirdParty(thirdParty));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function createThirdParty(req, res) {
  try {
    const data = validate(thirdPartyCreateSchema, req.body);
    const { approvedAt, expiresAt } = cycleDates(data);
    const thirdPartyId = await prisma.$transaction(async (transaction) => {
      const thirdParty = await transaction.thirdParty.create({
        data: identityData(data),
        select: { id: true }
      });
      const cycle = await transaction.thirdPartyAccessCycle.create({
        data: {
          thirdPartyId: thirdParty.id,
          approvedAt,
          expiresAt,
          grants: {
            create: data.systems.map((system) => ({ system }))
          }
        },
        select: { id: true }
      });
      await transaction.thirdPartyAccessActivity.create({
        data: {
          thirdPartyId: thirdParty.id,
          cycleId: cycle.id,
          kind: 'Created',
          message: `Acesso aprovado ate ${expiresAt.toISOString().slice(0, 10)}.`
        }
      });

      return thirdParty.id;
    });
    const thirdParty = await getThirdPartyRecord(thirdPartyId);

    res.status(201).json(serializeThirdParty(thirdParty));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateThirdParty(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(thirdPartyUpdateSchema, req.body);
    const existing = await prisma.thirdParty.findUnique({ where: { id } });

    if (!existing || existing.archivedAt) {
      return res.status(404).json({ error: 'Terceiro nao encontrado' });
    }

    const changedFields = changedFieldLabels(existing, data);
    await prisma.$transaction(async (transaction) => {
      await transaction.thirdParty.update({
        where: { id },
        data: identityData(data)
      });

      if (changedFields.length > 0) {
        await transaction.thirdPartyAccessActivity.create({
          data: {
            thirdPartyId: id,
            kind: 'Updated',
            message: `Campos atualizados: ${changedFields.join(', ')}.`
          }
        });
      }
    });
    const thirdParty = await getThirdPartyRecord(id);

    res.json(serializeThirdParty(thirdParty));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function renewThirdPartyAccess(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(thirdPartyRenewSchema, req.body);
    const { approvedAt, expiresAt } = cycleDates(data);
    const existing = await getThirdPartyRecord(id);

    if (!existing || existing.archivedAt) {
      return res.status(404).json({ error: 'Terceiro nao encontrado' });
    }

    const currentCycle = existing.cycles.find((cycle) => !cycle.closedAt);

    if (!currentCycle) {
      fail('Nao existe um ciclo atual para renovar');
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.thirdPartyAccessCycle.update({
        where: { id: currentCycle.id },
        data: {
          closedAt: new Date(),
          closureKind: 'Renewed',
          closureReason: `Renovado em ${approvedAt.toISOString().slice(0, 10)}`
        }
      });
      const newCycle = await transaction.thirdPartyAccessCycle.create({
        data: {
          thirdPartyId: id,
          approvedAt,
          expiresAt,
          grants: {
            create: data.systems.map((system) => ({ system }))
          }
        },
        select: { id: true }
      });
      await transaction.thirdPartyAccessActivity.create({
        data: {
          thirdPartyId: id,
          cycleId: newCycle.id,
          kind: 'Renewed',
          message: `Acessos renovados ate ${expiresAt.toISOString().slice(0, 10)}.`,
          author: data.author
        }
      });
    });
    const thirdParty = await getThirdPartyRecord(id);

    res.json(serializeThirdParty(thirdParty));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function closeThirdPartyAccess(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(thirdPartyCloseSchema, req.body);
    const existing = await getThirdPartyRecord(id);

    if (!existing || existing.archivedAt) {
      return res.status(404).json({ error: 'Terceiro nao encontrado' });
    }

    const currentCycle = existing.cycles.find((cycle) => !cycle.closedAt);

    if (!currentCycle) {
      fail('Os acessos deste terceiro ja estao encerrados');
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.thirdPartyAccessCycle.update({
        where: { id: currentCycle.id },
        data: {
          closedAt: new Date(),
          closureKind: 'Closed',
          closureReason: data.reason
        }
      });
      await transaction.thirdPartyAccessActivity.create({
        data: {
          thirdPartyId: id,
          cycleId: currentCycle.id,
          kind: 'Closed',
          message: `Acessos encerrados: ${data.reason}`,
          author: data.author
        }
      });
    });
    const thirdParty = await getThirdPartyRecord(id);

    res.json(serializeThirdParty(thirdParty));
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteThirdParty(req, res) {
  try {
    const id = parseId(req.params.id);

    await prisma.$transaction(async (transaction) => {
      const thirdParty = await transaction.thirdParty.findUnique({
        where: { id },
        select: {
          id: true,
          archivedAt: true,
          cycles: {
            where: { closedAt: null },
            select: { id: true },
            take: 1
          }
        }
      });

      if (!thirdParty || thirdParty.archivedAt) {
        fail('Terceiro nao encontrado', 404);
      }

      if (thirdParty.cycles.length > 0) {
        fail('Encerre os acessos antes de excluir o terceiro', 409);
      }

      await transaction.thirdParty.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function createThirdPartyNote(req, res) {
  try {
    const thirdPartyId = parseId(req.params.id);
    const data = validate(thirdPartyNoteSchema, req.body);
    const thirdParty = await prisma.thirdParty.findUnique({
      where: { id: thirdPartyId },
      select: { id: true, archivedAt: true }
    });

    if (!thirdParty || thirdParty.archivedAt) {
      return res.status(404).json({ error: 'Terceiro nao encontrado' });
    }

    const activity = await prisma.thirdPartyAccessActivity.create({
      data: {
        thirdPartyId,
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

export async function deleteThirdPartyNote(req, res) {
  try {
    const id = parseId(req.params.id);
    const activity = await prisma.thirdPartyAccessActivity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Atividade nao encontrada' });
    }

    if (activity.kind !== 'Note') {
      fail('Atividades do sistema nao podem ser excluidas');
    }

    await prisma.thirdPartyAccessActivity.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
}

export const thirdPartyAccessInternals = {
  accessState,
  addCalendarMonths,
  normalizeText,
  sortOperationally
};
