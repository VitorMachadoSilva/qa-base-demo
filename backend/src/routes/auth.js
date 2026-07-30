import { Router } from 'express';
import {
  acknowledgePasswordNotice,
  changePassword,
  currentSession,
  login,
  logout
} from '../controllers/authController.js';

export const publicAuthRouter = Router();
export const protectedAuthRouter = Router();

publicAuthRouter.post('/login', login);

protectedAuthRouter.get('/session', currentSession);
protectedAuthRouter.post('/logout', logout);
protectedAuthRouter.put('/password', changePassword);
protectedAuthRouter.post('/password-notice', acknowledgePasswordNotice);
