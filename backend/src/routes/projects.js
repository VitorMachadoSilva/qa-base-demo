import { Router } from 'express';
import {
  createProject,
  deleteProject,
  exportProjectBackup,
  listProjects,
  updateProject
} from '../controllers/projectsController.js';

export const projectsRouter = Router();

projectsRouter.get('/', listProjects);
projectsRouter.post('/', createProject);
projectsRouter.get('/:id/backup', exportProjectBackup);
projectsRouter.put('/:id', updateProject);
projectsRouter.delete('/:id', deleteProject);
