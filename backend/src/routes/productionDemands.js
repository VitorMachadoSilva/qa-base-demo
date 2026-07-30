import { Router } from 'express';
import {
  closeProductionDemand,
  createProductionDemand,
  createProductionDemandNote,
  deleteProductionDemand,
  deleteProductionDemandNote,
  getProductionDemand,
  getProductionDemandSummary,
  listProductionDemands,
  reopenProductionDemand,
  updateProductionDemand
} from '../controllers/productionDemandsController.js';

export const productionDemandsRouter = Router();

productionDemandsRouter.get(
  '/projects/:projectId/production-demands/summary',
  getProductionDemandSummary
);
productionDemandsRouter.get(
  '/projects/:projectId/production-demands',
  listProductionDemands
);
productionDemandsRouter.post(
  '/projects/:projectId/production-demands',
  createProductionDemand
);
productionDemandsRouter.get('/production-demands/:id', getProductionDemand);
productionDemandsRouter.put('/production-demands/:id', updateProductionDemand);
productionDemandsRouter.delete('/production-demands/:id', deleteProductionDemand);
productionDemandsRouter.post(
  '/production-demands/:id/notes',
  createProductionDemandNote
);
productionDemandsRouter.post(
  '/production-demands/:id/close',
  closeProductionDemand
);
productionDemandsRouter.post(
  '/production-demands/:id/reopen',
  reopenProductionDemand
);
productionDemandsRouter.delete(
  '/production-demand-activities/:id',
  deleteProductionDemandNote
);
