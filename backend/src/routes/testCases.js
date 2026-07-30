import { Router } from 'express';
import {
  createTestCase,
  deleteTestCase,
  getTestCase,
  listProjectTestCases,
  listTestCases,
  updateTestCase
} from '../controllers/testCasesController.js';

export const testCasesRouter = Router();

testCasesRouter.get('/suites/:suiteId/cases', listTestCases);
testCasesRouter.post('/suites/:suiteId/cases', createTestCase);
testCasesRouter.get('/projects/:projectId/cases', listProjectTestCases);
testCasesRouter.get('/cases/:id', getTestCase);
testCasesRouter.put('/cases/:id', updateTestCase);
testCasesRouter.delete('/cases/:id', deleteTestCase);
