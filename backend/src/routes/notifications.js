import { Router } from 'express';
import {
  connectTelegramGroup,
  disconnectTelegram,
  discoverTelegramGroup,
  indexNotificationDeliveries,
  resendNotification,
  saveNotificationSettings,
  showNotificationDelivery,
  showNotificationOverview,
  showNotificationSettings,
  showTelegramStatus,
  testTelegram
} from '../controllers/notificationsController.js';

export const notificationsRouter = Router();

notificationsRouter.get('/notifications/overview', showNotificationOverview);
notificationsRouter.get('/notifications/settings', showNotificationSettings);
notificationsRouter.put('/notifications/settings', saveNotificationSettings);
notificationsRouter.get('/notifications/telegram/status', showTelegramStatus);
notificationsRouter.post('/notifications/telegram/discover', discoverTelegramGroup);
notificationsRouter.post('/notifications/telegram/connect', connectTelegramGroup);
notificationsRouter.delete('/notifications/telegram/connection', disconnectTelegram);
notificationsRouter.post('/notifications/telegram/test', testTelegram);
notificationsRouter.get('/notifications/deliveries', indexNotificationDeliveries);
notificationsRouter.get('/notifications/deliveries/:id', showNotificationDelivery);
notificationsRouter.post('/notifications/deliveries/:id/resend', resendNotification);
