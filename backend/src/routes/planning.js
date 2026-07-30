import { Router } from 'express';
import {
  createConfigurationGroup,
  createConfigurationOption,
  createEnvironment,
  createMilestone,
  deleteConfigurationGroup,
  deleteConfigurationOption,
  deleteEnvironment,
  deleteMilestone,
  getMilestone,
  listConfigurationGroups,
  listEnvironments,
  listMilestones,
  updateConfigurationGroup,
  updateConfigurationOption,
  updateEnvironment,
  updateMilestone
} from '../controllers/planningController.js';

export const planningRouter = Router();

planningRouter.get('/projects/:projectId/milestones', listMilestones);
planningRouter.post('/projects/:projectId/milestones', createMilestone);
planningRouter.get('/milestones/:id', getMilestone);
planningRouter.put('/milestones/:id', updateMilestone);
planningRouter.delete('/milestones/:id', deleteMilestone);

planningRouter.get('/projects/:projectId/environments', listEnvironments);
planningRouter.post('/projects/:projectId/environments', createEnvironment);
planningRouter.put('/environments/:id', updateEnvironment);
planningRouter.delete('/environments/:id', deleteEnvironment);

planningRouter.get('/projects/:projectId/configurations', listConfigurationGroups);
planningRouter.post('/projects/:projectId/configuration-groups', createConfigurationGroup);
planningRouter.put('/configuration-groups/:id', updateConfigurationGroup);
planningRouter.delete('/configuration-groups/:id', deleteConfigurationGroup);
planningRouter.post('/configuration-groups/:groupId/options', createConfigurationOption);
planningRouter.put('/configuration-options/:id', updateConfigurationOption);
planningRouter.delete('/configuration-options/:id', deleteConfigurationOption);
