import { parseId, sendError } from '../utils/http.js';
import {
  notificationDeliveryFilterSchema,
  notificationGroupConfirmationSchema,
  notificationSettingsSchema,
  validate
} from '../validation/schemas.js';
import {
  confirmTelegramGroup,
  createTestDelivery,
  disconnectTelegramGroup,
  discoverTelegramGroups,
  getNotificationDelivery,
  getNotificationOverview,
  getNotificationSettings,
  getTelegramStatus,
  listNotificationDeliveries,
  resendNotificationDelivery,
  serializeNotificationSettings,
  updateNotificationSettings
} from '../services/notificationService.js';

export async function showNotificationOverview(req, res) {
  try {
    res.json(await getNotificationOverview());
  } catch (error) {
    sendError(res, error);
  }
}

export async function showNotificationSettings(req, res) {
  try {
    res.json(serializeNotificationSettings(await getNotificationSettings()));
  } catch (error) {
    sendError(res, error);
  }
}

export async function saveNotificationSettings(req, res) {
  try {
    res.json(await updateNotificationSettings(validate(notificationSettingsSchema, req.body)));
  } catch (error) {
    sendError(res, error);
  }
}

export async function showTelegramStatus(req, res) {
  try {
    res.json(await getTelegramStatus());
  } catch (error) {
    sendError(res, error);
  }
}

export async function discoverTelegramGroup(req, res) {
  try {
    res.json(await discoverTelegramGroups());
  } catch (error) {
    sendError(res, error);
  }
}

export async function connectTelegramGroup(req, res) {
  try {
    const data = validate(notificationGroupConfirmationSchema, req.body);
    res.json(await confirmTelegramGroup(data.chatId));
  } catch (error) {
    sendError(res, error);
  }
}

export async function disconnectTelegram(req, res) {
  try {
    res.json(await disconnectTelegramGroup());
  } catch (error) {
    sendError(res, error);
  }
}

export async function testTelegram(req, res) {
  try {
    res.status(201).json(await createTestDelivery());
  } catch (error) {
    sendError(res, error);
  }
}

export async function indexNotificationDeliveries(req, res) {
  try {
    const filters = validate(notificationDeliveryFilterSchema, req.query);
    res.json(await listNotificationDeliveries(filters));
  } catch (error) {
    sendError(res, error);
  }
}

export async function showNotificationDelivery(req, res) {
  try {
    res.json(await getNotificationDelivery(parseId(req.params.id)));
  } catch (error) {
    sendError(res, error);
  }
}

export async function resendNotification(req, res) {
  try {
    res.status(201).json(await resendNotificationDelivery(parseId(req.params.id)));
  } catch (error) {
    sendError(res, error);
  }
}
