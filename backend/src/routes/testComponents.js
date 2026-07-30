import { Router } from 'express';
import {
  createTestComponent,
  deleteTestComponent,
  listTestComponents,
  updateTestComponent
} from '../controllers/testComponentsController.js';

export const testComponentsRouter = Router();

testComponentsRouter.get('/projects/:projectId/components', listTestComponents);
testComponentsRouter.post('/projects/:projectId/components', createTestComponent);
testComponentsRouter.put('/components/:id', updateTestComponent);
testComponentsRouter.delete('/components/:id', deleteTestComponent);
