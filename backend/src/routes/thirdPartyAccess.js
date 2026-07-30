import { Router } from 'express';
import {
  closeThirdPartyAccess,
  createThirdParty,
  createThirdPartyNote,
  deleteThirdParty,
  deleteThirdPartyNote,
  getThirdParty,
  getThirdPartySummary,
  listThirdParties,
  renewThirdPartyAccess,
  updateThirdParty
} from '../controllers/thirdPartyAccessController.js';

export const thirdPartyAccessRouter = Router();

thirdPartyAccessRouter.get('/third-parties/summary', getThirdPartySummary);
thirdPartyAccessRouter.get('/third-parties', listThirdParties);
thirdPartyAccessRouter.post('/third-parties', createThirdParty);
thirdPartyAccessRouter.get('/third-parties/:id', getThirdParty);
thirdPartyAccessRouter.put('/third-parties/:id', updateThirdParty);
thirdPartyAccessRouter.delete('/third-parties/:id', deleteThirdParty);
thirdPartyAccessRouter.post('/third-parties/:id/renew', renewThirdPartyAccess);
thirdPartyAccessRouter.post('/third-parties/:id/close', closeThirdPartyAccess);
thirdPartyAccessRouter.post('/third-parties/:id/notes', createThirdPartyNote);
thirdPartyAccessRouter.delete(
  '/third-party-access-activities/:id',
  deleteThirdPartyNote
);
