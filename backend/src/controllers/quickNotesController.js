import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import {
  quickNoteCreateSchema,
  quickNoteFilterSchema,
  quickNoteUpdateSchema,
  validate
} from '../validation/schemas.js';

const configuredTimeZone = process.env.QABASE_TIME_ZONE || 'America/Sao_Paulo';

function timeZoneFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat('en', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return new Intl.DateTimeFormat('en', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

const civilDayFormatter = timeZoneFormatter(configuredTimeZone);

function civilDay(value = new Date()) {
  const parts = Object.fromEntries(
    civilDayFormatter
      .formatToParts(new Date(value))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function noteData(data) {
  return {
    title: data.title,
    content: data.content,
    color: data.color,
    pinned: data.pinned
  };
}

function handleControllerError(res, error) {
  sendError(res, error);
}

export async function listQuickNotes(req, res) {
  try {
    const filters = validate(quickNoteFilterSchema, req.query);
    const query = filters.q?.trim();
    const notes = await prisma.quickNote.findMany({
      where: {
        ownerId: req.user.id,
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                { content: { contains: query } }
              ]
            }
          : filters.day
            ? { createdDay: filters.day }
            : {}),
        ...(filters.pinned === undefined ? {} : { pinned: filters.pinned })
      },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }]
    });

    res.json(notes);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function listQuickNoteDays(req, res) {
  try {
    const today = civilDay();
    const groups = await prisma.quickNote.groupBy({
      by: ['createdDay'],
      where: { ownerId: req.user.id },
      _count: { _all: true },
      orderBy: { createdDay: 'desc' }
    });
    const days = groups.map((group) => ({
      day: group.createdDay,
      count: group._count._all
    }));

    if (!days.some((item) => item.day === today)) {
      days.unshift({ day: today, count: 0 });
    }

    res.json({
      today,
      total: days.reduce((sum, item) => sum + item.count, 0),
      days
    });
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function getQuickNote(req, res) {
  try {
    const id = parseId(req.params.id);
    const note = await prisma.quickNote.findFirst({
      where: { id, ownerId: req.user.id }
    });

    if (!note) {
      return res.status(404).json({ error: 'Anotacao nao encontrada' });
    }

    res.json(note);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function createQuickNote(req, res) {
  try {
    const data = validate(quickNoteCreateSchema, req.body);
    const note = await prisma.quickNote.create({
      data: {
        ...noteData(data),
        ownerId: req.user.id,
        createdDay: civilDay()
      }
    });

    res.status(201).json(note);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function updateQuickNote(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(quickNoteUpdateSchema, req.body);
    const existing = await prisma.quickNote.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Anotacao nao encontrada' });
    }

    const note = await prisma.quickNote.update({
      where: { id },
      data: noteData(data)
    });

    res.json(note);
  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function deleteQuickNote(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.quickNote.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Anotacao nao encontrada' });
    }

    await prisma.quickNote.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
}

export const quickNoteInternals = {
  civilDay,
  configuredTimeZone
};
