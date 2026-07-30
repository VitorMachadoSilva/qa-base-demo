import { Router } from 'express';
import {
  createSuite,
  deleteSuite,
  listSuites,
  updateSuite
} from '../controllers/suitesController.js';

export const suitesRouter = Router();

suitesRouter.get('/projects/:projectId/suites', listSuites);
suitesRouter.post('/projects/:projectId/suites', createSuite);
suitesRouter.put('/suites/:id', updateSuite);
suitesRouter.delete('/suites/:id', deleteSuite);
