import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import { projectSchema, validate } from '../validation/schemas.js';
export { exportProjectBackup } from './projectBackupsController.js';

export async function listProjects(req, res) {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { suites: true, runs: true }
        }
      }
    });

    res.json(projects);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createProject(req, res) {
  try {
    const data = validate(projectSchema, req.body);
    const project = await prisma.project.create({
      data: { ...data, ownerId: req.user.id }
    });

    res.status(201).json(project);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateProject(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(projectSchema, req.body);

    const project = await prisma.project.update({
      where: { id, ownerId: req.user.id },
      data
    });

    res.json(project);
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Projeto nao encontrado';
    }

    sendError(res, error);
  }
}

export async function deleteProject(req, res) {
  try {
    const id = parseId(req.params.id);

    await prisma.project.delete({ where: { id, ownerId: req.user.id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Projeto nao encontrado';
    }

    sendError(res, error);
  }
}
