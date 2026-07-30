import { Router } from 'express';
import {
  createValidationBrief,
  createValidationCheck,
  createValidationCriterion,
  createValidationFolder,
  createValidationNote,
  deleteValidationBrief,
  deleteValidationCheck,
  deleteValidationCriterion,
  deleteValidationFolder,
  deleteValidationNote,
  getValidationBrief,
  listValidationBriefs,
  listValidationFolders,
  promoteValidationCheck,
  updateValidationBrief,
  updateValidationCheck,
  updateValidationCriterion,
  updateValidationFolder
} from '../controllers/validationBriefsController.js';

export const validationBriefsRouter = Router();

validationBriefsRouter.get('/projects/:projectId/validation-folders', listValidationFolders);
validationBriefsRouter.post('/projects/:projectId/validation-folders', createValidationFolder);
validationBriefsRouter.put('/validation-folders/:id', updateValidationFolder);
validationBriefsRouter.delete('/validation-folders/:id', deleteValidationFolder);

validationBriefsRouter.get('/projects/:projectId/validation-briefs', listValidationBriefs);
validationBriefsRouter.post('/projects/:projectId/validation-briefs', createValidationBrief);
validationBriefsRouter.get('/validation-briefs/:id', getValidationBrief);
validationBriefsRouter.put('/validation-briefs/:id', updateValidationBrief);
validationBriefsRouter.delete('/validation-briefs/:id', deleteValidationBrief);

validationBriefsRouter.post(
  '/validation-briefs/:briefId/criteria',
  createValidationCriterion
);
validationBriefsRouter.put('/validation-criteria/:id', updateValidationCriterion);
validationBriefsRouter.delete('/validation-criteria/:id', deleteValidationCriterion);

validationBriefsRouter.post('/validation-briefs/:briefId/checks', createValidationCheck);
validationBriefsRouter.put('/validation-checks/:id', updateValidationCheck);
validationBriefsRouter.delete('/validation-checks/:id', deleteValidationCheck);
validationBriefsRouter.post('/validation-checks/:id/promote', promoteValidationCheck);

validationBriefsRouter.post('/validation-briefs/:briefId/notes', createValidationNote);
validationBriefsRouter.delete('/validation-notes/:id', deleteValidationNote);
