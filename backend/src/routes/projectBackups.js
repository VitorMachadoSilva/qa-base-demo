import { Router } from 'express';
import {
  importProjectBackup,
  previewProjectBackup
} from '../controllers/projectBackupsController.js';

export const projectBackupsRouter = Router();

projectBackupsRouter.post('/preview', previewProjectBackup);
projectBackupsRouter.post('/import', importProjectBackup);
