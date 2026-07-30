import { Router } from 'express';
import {
  createQuickNote,
  deleteQuickNote,
  getQuickNote,
  listQuickNoteDays,
  listQuickNotes,
  updateQuickNote
} from '../controllers/quickNotesController.js';

export const quickNotesRouter = Router();

quickNotesRouter.get('/quick-notes/days', listQuickNoteDays);
quickNotesRouter.get('/quick-notes', listQuickNotes);
quickNotesRouter.post('/quick-notes', createQuickNote);
quickNotesRouter.get('/quick-notes/:id', getQuickNote);
quickNotesRouter.put('/quick-notes/:id', updateQuickNote);
quickNotesRouter.delete('/quick-notes/:id', deleteQuickNote);
