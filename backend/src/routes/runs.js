import { Router } from 'express';
import {
  completeRun,
  createRun,
  getRun,
  listRuns,
  updateRunCase
} from '../controllers/runsController.js';

export const runsRouter = Router();

runsRouter.get('/projects/:projectId/runs', listRuns);
runsRouter.post('/projects/:projectId/runs', createRun);
runsRouter.get('/runs/:id', getRun);
runsRouter.put('/runs/:id', completeRun);
runsRouter.put('/run-cases/:runTestCaseId', updateRunCase);
