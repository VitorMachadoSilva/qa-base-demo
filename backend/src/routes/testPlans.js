import { Router } from 'express';
import {
  createTestPlan,
  deleteTestPlan,
  getTestPlan,
  listTestPlans,
  updateTestPlan
} from '../controllers/testPlansController.js';

export const testPlansRouter = Router();

testPlansRouter.get('/projects/:projectId/plans', listTestPlans);
testPlansRouter.post('/projects/:projectId/plans', createTestPlan);
testPlansRouter.get('/plans/:id', getTestPlan);
testPlansRouter.put('/plans/:id', updateTestPlan);
testPlansRouter.delete('/plans/:id', deleteTestPlan);
