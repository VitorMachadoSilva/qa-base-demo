import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import { suiteSchema, validate } from '../validation/schemas.js';

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function validateParent(projectId, suiteId, parentId) {
  if (parentId == null) {
    return;
  }

  if (parentId === suiteId) {
    throw validationError('Uma suite nao pode ser pai dela mesma');
  }

  let currentSuite = await prisma.suite.findUnique({
    where: { id: parentId },
    select: { id: true, projectId: true, parentId: true }
  });

  if (!currentSuite || currentSuite.projectId !== projectId) {
    throw validationError('Suite pai invalida para este projeto');
  }

  while (currentSuite) {
    if (currentSuite.id === suiteId) {
      throw validationError('Nao e possivel criar um ciclo na hierarquia de suites');
    }

    currentSuite = currentSuite.parentId
      ? await prisma.suite.findUnique({
          where: { id: currentSuite.parentId },
          select: { id: true, projectId: true, parentId: true }
        })
      : null;
  }
}

export async function listSuites(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');

    const suites = await prisma.suite.findMany({
      where: { projectId },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { testCases: true }
        }
      }
    });

    res.json(suites);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createSuite(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(suiteSchema, req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto nao encontrado' });
    }

    await validateParent(projectId, null, data.parentId);

    const suite = await prisma.suite.create({
      data: { ...data, projectId }
    });

    res.status(201).json(suite);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateSuite(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(suiteSchema, req.body);

    const existingSuite = await prisma.suite.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    });

    if (!existingSuite) {
      return res.status(404).json({ error: 'Suite nao encontrada' });
    }

    await validateParent(existingSuite.projectId, id, data.parentId);

    const suite = await prisma.suite.update({
      where: { id },
      data
    });

    res.json(suite);
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Suite nao encontrada';
    }

    sendError(res, error);
  }
}

export async function deleteSuite(req, res) {
  try {
    const id = parseId(req.params.id);

    await prisma.suite.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Suite nao encontrada';
    }

    sendError(res, error);
  }
}
