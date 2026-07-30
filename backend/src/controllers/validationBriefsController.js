import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import {
  validate,
  validationBriefCreateSchema,
  validationBriefUpdateSchema,
  validationCheckCreateSchema,
  validationCheckUpdateSchema,
  validationCriterionCreateSchema,
  validationCriterionUpdateSchema,
  validationFolderSchema,
  validationNoteSchema,
  validationPromotionSchema
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

async function ensureFolder(projectId, folderId) {
  if (!folderId) {
    return null;
  }

  const folder = await prisma.validationFolder.findUnique({
    where: { id: folderId },
    select: { id: true, projectId: true, parentId: true }
  });

  if (!folder || folder.projectId !== projectId) {
    fail('Pasta invalida para este projeto');
  }

  return folder;
}

async function ensureUniqueFolderName(projectId, parentId, name, ignoredId) {
  const siblings = await prisma.validationFolder.findMany({
    where: { projectId, parentId: parentId || null },
    select: { id: true, name: true }
  });
  const normalizedName = name.toLocaleLowerCase('pt-BR');

  if (
    siblings.some(
      (folder) =>
        folder.id !== ignoredId &&
        folder.name.toLocaleLowerCase('pt-BR') === normalizedName
    )
  ) {
    fail('Ja existe uma pasta com este nome neste nivel', 409);
  }
}

async function ensureFolderHierarchy(projectId, folderId, parentId) {
  if (!parentId) {
    return;
  }

  if (folderId === parentId) {
    fail('Uma pasta nao pode ser pai dela mesma');
  }

  let current = await ensureFolder(projectId, parentId);

  while (current?.parentId) {
    if (current.parentId === folderId) {
      fail('Nao e possivel criar um ciclo na hierarquia de pastas');
    }

    current = await ensureFolder(projectId, current.parentId);
  }
}

function summarizeBrief(brief) {
  const criteria = brief.criteria || [];
  const checks = brief.checks || [];
  const summary = {
    criteriaTotal: criteria.length,
    criteriaMet: criteria.filter((criterion) => criterion.isMet).length,
    checksTotal: checks.length,
    executed: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: 0,
    progressPercentage: 0
  };

  checks.forEach((check) => {
    const key = check.status.toLowerCase();

    if (key in summary) {
      summary[key] += 1;
    }
  });

  summary.executed = summary.checksTotal - summary.untested;
  summary.progressPercentage = summary.checksTotal
    ? Math.round((summary.executed / summary.checksTotal) * 100)
    : 0;

  return summary;
}

function serializeBrief(brief) {
  return {
    ...brief,
    summary: summarizeBrief(brief)
  };
}

const briefDetailInclude = {
  folder: {
    select: { id: true, name: true, parentId: true }
  },
  criteria: {
    orderBy: { position: 'asc' }
  },
  checks: {
    orderBy: { position: 'asc' },
    include: {
      testCase: {
        select: {
          id: true,
          title: true,
          suiteId: true,
          suite: {
            select: { id: true, name: true }
          }
        }
      }
    }
  },
  notes: {
    orderBy: { createdAt: 'desc' }
  }
};

async function getBriefDetail(id) {
  return prisma.validationBrief.findUnique({
    where: { id },
    include: briefDetailInclude
  });
}

async function reorderItems(transaction, modelName, briefId, itemId, position) {
  const model = transaction[modelName];
  const records = await model.findMany({
    where: { briefId },
    orderBy: { position: 'asc' },
    select: { id: true }
  });
  const orderedIds = records.map((record) => record.id).filter((id) => id !== itemId);
  const targetIndex = Math.max(0, Math.min(position - 1, orderedIds.length));
  orderedIds.splice(targetIndex, 0, itemId);

  for (const [index, id] of orderedIds.entries()) {
    await model.update({
      where: { id },
      data: { position: -(index + 1) }
    });
  }

  for (const [index, id] of orderedIds.entries()) {
    await model.update({
      where: { id },
      data: { position: index + 1 }
    });
  }
}

async function compactItems(transaction, modelName, briefId) {
  const model = transaction[modelName];
  const records = await model.findMany({
    where: { briefId },
    orderBy: { position: 'asc' },
    select: { id: true }
  });

  for (const [index, record] of records.entries()) {
    await model.update({
      where: { id: record.id },
      data: { position: index + 1 }
    });
  }
}

export async function listValidationFolders(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    const folders = await prisma.validationFolder.findMany({
      where: { projectId },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { briefs: true, children: true }
        }
      }
    });
    res.json(folders);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createValidationFolder(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(validationFolderSchema, req.body);
    await ensureProject(projectId);
    await ensureFolder(projectId, data.parentId);
    await ensureUniqueFolderName(projectId, data.parentId, data.name);
    const folder = await prisma.validationFolder.create({
      data: {
        projectId,
        parentId: data.parentId || null,
        name: data.name
      },
      include: {
        _count: {
          select: { briefs: true, children: true }
        }
      }
    });
    res.status(201).json(folder);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateValidationFolder(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(validationFolderSchema, req.body);
    const existing = await prisma.validationFolder.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pasta nao encontrada' });
    }

    await ensureFolder(existing.projectId, data.parentId);
    await ensureFolderHierarchy(existing.projectId, id, data.parentId);
    await ensureUniqueFolderName(
      existing.projectId,
      data.parentId,
      data.name,
      id
    );
    const folder = await prisma.validationFolder.update({
      where: { id },
      data: {
        name: data.name,
        parentId: data.parentId || null
      },
      include: {
        _count: {
          select: { briefs: true, children: true }
        }
      }
    });
    res.json(folder);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteValidationFolder(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.validationFolder.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pasta nao encontrada' });
    }

    const projectFolders = await prisma.validationFolder.findMany({
      where: { projectId: existing.projectId },
      select: { id: true, parentId: true }
    });
    const descendantIds = [id];

    for (let index = 0; index < descendantIds.length; index += 1) {
      const parentId = descendantIds[index];
      projectFolders
        .filter((folder) => folder.parentId === parentId)
        .forEach((folder) => descendantIds.push(folder.id));
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.validationBrief.updateMany({
        where: { folderId: { in: descendantIds } },
        data: { folderId: null }
      });
      await transaction.validationFolder.delete({ where: { id } });
    });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

export async function listValidationBriefs(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const folderFilter = req.query.folderId;
    await ensureProject(projectId);

    let folderId;
    if (folderFilter && folderFilter !== 'unfiled') {
      folderId = parseId(folderFilter, 'folderId');
      await ensureFolder(projectId, folderId);
    }

    const briefs = await prisma.validationBrief.findMany({
      where: {
        projectId,
        ...(folderFilter === 'unfiled'
          ? { folderId: null }
          : folderId
            ? { folderId }
            : {}),
        ...(req.query.status ? { status: req.query.status } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                { objective: { contains: query } },
                { scope: { contains: query } },
                { generalNotes: { contains: query } }
              ]
            }
          : {})
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        folder: {
          select: { id: true, name: true, parentId: true }
        },
        criteria: {
          select: { isMet: true }
        },
        checks: {
          select: { status: true }
        }
      }
    });
    res.json(briefs.map(serializeBrief));
  } catch (error) {
    sendError(res, error);
  }
}

export async function getValidationBrief(req, res) {
  try {
    const id = parseId(req.params.id);
    const brief = await getBriefDetail(id);

    if (!brief) {
      return res.status(404).json({ error: 'Ficha de validacao nao encontrada' });
    }

    res.json(serializeBrief(brief));
  } catch (error) {
    sendError(res, error);
  }
}

export async function createValidationBrief(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(validationBriefCreateSchema, req.body);
    await ensureProject(projectId);
    await ensureFolder(projectId, data.folderId);
    const brief = await prisma.validationBrief.create({
      data: {
        projectId,
        folderId: data.folderId || null,
        title: data.title,
        sourceUrl: data.sourceUrl,
        objective: data.objective,
        scope: data.scope,
        generalNotes: data.generalNotes,
        status: data.status,
        completedAt: data.status === 'Completed' ? new Date() : null,
        criteria: {
          create: data.criteria.map((criterion, index) => ({
            position: index + 1,
            text: criterion.text
          }))
        },
        checks: {
          create: data.checks.map((check, index) => ({
            position: index + 1,
            title: check.title,
            expectedResult: check.expectedResult
          }))
        }
      },
      include: briefDetailInclude
    });
    res.status(201).json(serializeBrief(brief));
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateValidationBrief(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(validationBriefUpdateSchema, req.body);
    const existing = await prisma.validationBrief.findUnique({
      where: { id },
      select: { id: true, projectId: true, completedAt: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Ficha de validacao nao encontrada' });
    }

    await ensureFolder(existing.projectId, data.folderId);
    const brief = await prisma.validationBrief.update({
      where: { id },
      data: {
        ...data,
        folderId: data.folderId || null,
        completedAt:
          data.status === 'Completed' ? existing.completedAt || new Date() : null
      },
      include: briefDetailInclude
    });
    res.json(serializeBrief(brief));
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteValidationBrief(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.validationBrief.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Ficha de validacao nao encontrada' });
    }

    await prisma.validationBrief.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

export async function createValidationCriterion(req, res) {
  try {
    const briefId = parseId(req.params.briefId, 'briefId');
    const data = validate(validationCriterionCreateSchema, req.body);
    const brief = await prisma.validationBrief.findUnique({
      where: { id: briefId },
      select: { id: true }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Ficha de validacao nao encontrada' });
    }

    const criterion = await prisma.$transaction(async (transaction) => {
      const count = await transaction.validationCriterion.count({ where: { briefId } });
      const created = await transaction.validationCriterion.create({
        data: {
          briefId,
          position: count + 1,
          text: data.text,
          isMet: data.isMet
        }
      });

      if (data.position && data.position !== created.position) {
        await reorderItems(
          transaction,
          'validationCriterion',
          briefId,
          created.id,
          data.position
        );
      }

      return transaction.validationCriterion.findUnique({ where: { id: created.id } });
    });
    res.status(201).json(criterion);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateValidationCriterion(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(validationCriterionUpdateSchema, req.body);
    const existing = await prisma.validationCriterion.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Criterio nao encontrado' });
    }

    const criterion = await prisma.$transaction(async (transaction) => {
      await transaction.validationCriterion.update({
        where: { id },
        data: { text: data.text, isMet: data.isMet }
      });

      if (data.position && data.position !== existing.position) {
        await reorderItems(
          transaction,
          'validationCriterion',
          existing.briefId,
          id,
          data.position
        );
      }

      return transaction.validationCriterion.findUnique({ where: { id } });
    });
    res.json(criterion);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteValidationCriterion(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.validationCriterion.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Criterio nao encontrado' });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.validationCriterion.delete({ where: { id } });
      await compactItems(
        transaction,
        'validationCriterion',
        existing.briefId
      );
    });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

export async function createValidationCheck(req, res) {
  try {
    const briefId = parseId(req.params.briefId, 'briefId');
    const data = validate(validationCheckCreateSchema, req.body);
    const brief = await prisma.validationBrief.findUnique({
      where: { id: briefId },
      select: { id: true }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Ficha de validacao nao encontrada' });
    }

    const check = await prisma.$transaction(async (transaction) => {
      const count = await transaction.validationCheck.count({ where: { briefId } });
      const created = await transaction.validationCheck.create({
        data: {
          briefId,
          position: count + 1,
          title: data.title,
          expectedResult: data.expectedResult,
          actualResult: data.actualResult,
          notes: data.notes,
          status: data.status,
          executedAt: data.status === 'Untested' ? null : new Date()
        }
      });

      if (data.position && data.position !== created.position) {
        await reorderItems(
          transaction,
          'validationCheck',
          briefId,
          created.id,
          data.position
        );
      }

      return transaction.validationCheck.findUnique({ where: { id: created.id } });
    });
    res.status(201).json(check);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateValidationCheck(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(validationCheckUpdateSchema, req.body);
    const existing = await prisma.validationCheck.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Teste da ficha nao encontrado' });
    }

    const check = await prisma.$transaction(async (transaction) => {
      await transaction.validationCheck.update({
        where: { id },
        data: {
          title: data.title,
          expectedResult: data.expectedResult,
          actualResult: data.actualResult,
          notes: data.notes,
          status: data.status,
          executedAt:
            data.status === 'Untested' ? null : existing.executedAt || new Date()
        }
      });

      if (data.position && data.position !== existing.position) {
        await reorderItems(
          transaction,
          'validationCheck',
          existing.briefId,
          id,
          data.position
        );
      }

      return transaction.validationCheck.findUnique({
        where: { id },
        include: {
          testCase: {
            select: {
              id: true,
              title: true,
              suiteId: true,
              suite: { select: { id: true, name: true } }
            }
          }
        }
      });
    });
    res.json(check);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteValidationCheck(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.validationCheck.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Teste da ficha nao encontrado' });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.validationCheck.delete({ where: { id } });
      await compactItems(transaction, 'validationCheck', existing.briefId);
    });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

export async function createValidationNote(req, res) {
  try {
    const briefId = parseId(req.params.briefId, 'briefId');
    const data = validate(validationNoteSchema, req.body);
    const brief = await prisma.validationBrief.findUnique({
      where: { id: briefId },
      select: { id: true }
    });

    if (!brief) {
      return res.status(404).json({ error: 'Ficha de validacao nao encontrada' });
    }

    const note = await prisma.validationNote.create({
      data: { briefId, ...data }
    });
    res.status(201).json(note);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteValidationNote(req, res) {
  try {
    const id = parseId(req.params.id);
    const existing = await prisma.validationNote.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Anotacao nao encontrada' });
    }

    await prisma.validationNote.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
}

export async function promoteValidationCheck(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(validationPromotionSchema, req.body);
    const check = await prisma.validationCheck.findUnique({
      where: { id },
      include: {
        brief: {
          select: { projectId: true }
        }
      }
    });

    if (!check) {
      return res.status(404).json({ error: 'Teste da ficha nao encontrado' });
    }

    if (check.testCaseId) {
      fail('Este teste ja foi promovido para o repositorio', 409);
    }

    const suite = await prisma.suite.findUnique({
      where: { id: data.suiteId },
      select: { id: true, projectId: true }
    });

    if (!suite || suite.projectId !== check.brief.projectId) {
      fail('Suite invalida para este projeto');
    }

    const result = await prisma.$transaction(async (transaction) => {
      const testCase = await transaction.testCase.create({
        data: {
          suiteId: suite.id,
          title: data.title,
          steps: check.title,
          expectedResult: data.expectedResult,
          priority: 'Medium',
          type: 'Functional',
          severity: 'Normal',
          automationStatus: 'Manual',
          testSteps: {
            create: [
              {
                position: 1,
                action: check.title,
                expectedResult: data.expectedResult
              }
            ]
          }
        },
        include: {
          testSteps: {
            orderBy: { position: 'asc' }
          },
          suite: {
            select: { id: true, name: true }
          }
        }
      });
      const promotedCheck = await transaction.validationCheck.update({
        where: { id },
        data: { testCaseId: testCase.id }
      });

      return { check: promotedCheck, testCase };
    });
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
}
