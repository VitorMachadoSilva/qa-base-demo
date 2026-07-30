import { randomUUID } from 'node:crypto';
import { prisma } from '../db/client.js';
import {
  addCivilDays,
  civilDate,
  differenceInCivilDays,
  initialPlannedDay,
  latestDueDay,
  nextFutureDay,
  scheduleHasPassed
} from './notificationTime.js';
import {
  renderAccessReport,
  renderDemandReport
} from './notificationRenderer.js';
import { createTelegramClient, TelegramError } from './telegramClient.js';

const SETTINGS_ID = 1;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000];
const ACTIVE_DEMAND_STATUSES = ['Open', 'InProgress', 'Waiting'];

function fail(message, status = 400, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
}

function safeTelegramError(error) {
  if (error instanceof TelegramError) {
    return {
      code: error.code,
      message: error.message,
      httpStatus: error.httpStatus
    };
  }

  return {
    code: 'DELIVERY_ERROR',
    message: 'Falha inesperada ao entregar a notificacao',
    httpStatus: null
  };
}

function channelReady(settings, transport) {
  return Boolean(
    transport.configured &&
      settings.telegramChatId &&
      settings.channelVerifiedAt &&
      settings.botVerifiedAt
  );
}

export async function getNotificationSettings() {
  return prisma.notificationSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      accessLeadDays: { create: [{ days: 7 }, { days: 2 }] }
    },
    update: {},
    include: {
      accessLeadDays: { orderBy: { days: 'desc' } }
    }
  });
}

export function serializeNotificationSettings(settings, transport = createTelegramClient()) {
  return {
    id: settings.id,
    enabled: settings.enabled,
    timeZone: settings.timeZone,
    sendTime: settings.sendTime,
    demandCadenceDays: settings.demandCadenceDays,
    accessLeadDays: settings.accessLeadDays.map((item) => item.days),
    nextDemandReportDay: settings.nextDemandReportDay,
    nextAccessReportDay: settings.nextAccessReportDay,
    telegram: {
      tokenConfigured: transport.configured,
      botVerified: Boolean(settings.botVerifiedAt),
      botUsername: settings.telegramBotUsername,
      channelConnected: Boolean(settings.telegramChatId && settings.channelVerifiedAt),
      chatTitle: settings.telegramChatTitle,
      chatType: settings.telegramChatType,
      verifiedAt: settings.channelVerifiedAt,
      ready: channelReady(settings, transport)
    },
    updatedAt: settings.updatedAt
  };
}

async function verifyBot(transport) {
  const bot = await transport.getMe();

  if (!bot?.id || !bot?.username) {
    fail('O Telegram nao retornou uma identidade de bot valida', 502);
  }

  await prisma.notificationSettings.update({
    where: { id: SETTINGS_ID },
    data: {
      telegramBotId: String(bot.id),
      telegramBotUsername: bot.username,
      botVerifiedAt: new Date()
    }
  });

  return bot;
}

export async function getTelegramStatus({ transport = createTelegramClient() } = {}) {
  const settings = await getNotificationSettings();

  if (!transport.configured) {
    return serializeNotificationSettings(settings, transport).telegram;
  }

  try {
    await verifyBot(transport);
    if (settings.telegramChatId) {
      const chat = await transport.getChat(settings.telegramChatId);
      if (!['group', 'supergroup'].includes(chat?.type)) {
        fail('O destino salvo nao e mais um grupo valido', 409);
      }
      await prisma.notificationSettings.update({
        where: { id: SETTINGS_ID },
        data: {
          telegramChatTitle: chat.title || settings.telegramChatTitle,
          telegramChatType: chat.type,
          channelVerifiedAt: new Date()
        }
      });
    }
  } catch (error) {
    await prisma.notificationSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        botVerifiedAt: null,
        channelVerifiedAt: settings.telegramChatId ? null : settings.channelVerifiedAt,
        enabled: false
      }
    });
    throw error;
  }

  const refreshed = await getNotificationSettings();
  return serializeNotificationSettings(refreshed, transport).telegram;
}

export async function updateNotificationSettings(
  data,
  { now = new Date(), transport = createTelegramClient() } = {}
) {
  const existing = await getNotificationSettings();

  if (data.enabled) {
    if (!transport.configured) {
      fail('Configure o token do Telegram no backend antes de ativar os envios', 409);
    }
    await verifyBot(transport);
    const refreshed = await getNotificationSettings();
    if (!refreshed.telegramChatId || !refreshed.channelVerifiedAt) {
      fail('Conecte e teste o grupo do Telegram antes de ativar os envios', 409);
    }
  }

  const scheduleChanged =
    existing.timeZone !== data.timeZone ||
    existing.sendTime !== data.sendTime ||
    existing.demandCadenceDays !== data.demandCadenceDays;
  const firstDay = initialPlannedDay(now, data.timeZone, data.sendTime);

  await prisma.$transaction(async (transaction) => {
    await transaction.notificationAccessLeadDay.deleteMany({
      where: { settingsId: SETTINGS_ID }
    });
    await transaction.notificationSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        enabled: data.enabled,
        timeZone: data.timeZone,
        sendTime: data.sendTime,
        demandCadenceDays: data.demandCadenceDays,
        nextDemandReportDay:
          scheduleChanged || !existing.nextDemandReportDay
            ? firstDay
            : existing.nextDemandReportDay,
        nextAccessReportDay:
          scheduleChanged || !existing.nextAccessReportDay
            ? firstDay
            : existing.nextAccessReportDay
      }
    });
    await transaction.notificationAccessLeadDay.createMany({
      data: data.accessLeadDays.map((days) => ({ settingsId: SETTINGS_ID, days }))
    });
  });

  return serializeNotificationSettings(await getNotificationSettings(), transport);
}

export async function discoverTelegramGroups({
  now = new Date(),
  transport = createTelegramClient()
} = {}) {
  if (!transport.configured) {
    fail('Configure o token do Telegram no backend antes de buscar o grupo', 409);
  }

  const settings = await getNotificationSettings();
  const bot = await verifyBot(transport);
  const updates = await transport.getUpdates(
    settings.lastDiscoveryUpdateId ? Number(settings.lastDiscoveryUpdateId) + 1 : undefined
  );
  const minimumDate = Math.floor(now.getTime() / 1000) - 30 * 60;
  const command = new RegExp(`^/connect@${bot.username}(?:\\s|$)`, 'i');
  const candidates = updates
    .filter((update) => {
      const message = update.message;
      return (
        message &&
        ['group', 'supergroup'].includes(message.chat?.type) &&
        message.date >= minimumDate &&
        command.test(message.text || '')
      );
    })
    .map((update) => ({
      updateId: String(update.update_id),
      chatId: String(update.message.chat.id),
      title: update.message.chat.title || 'Grupo sem titulo',
      type: update.message.chat.type,
      requestedAt: new Date(update.message.date * 1000)
    }))
    .filter(
      (candidate, index, list) =>
        list.findIndex((item) => item.chatId === candidate.chatId) === index
    );
  const latestUpdateId = updates.reduce(
    (latest, update) => Math.max(latest, Number(update.update_id)),
    Number(settings.lastDiscoveryUpdateId || 0)
  );

  if (latestUpdateId > 0) {
    await prisma.notificationSettings.update({
      where: { id: SETTINGS_ID },
      data: { lastDiscoveryUpdateId: String(latestUpdateId) }
    });
  }

  return { botUsername: bot.username, candidates };
}

export async function confirmTelegramGroup(
  chatId,
  { transport = createTelegramClient() } = {}
) {
  if (!transport.configured) {
    fail('Token do Telegram nao configurado', 409);
  }

  const bot = await verifyBot(transport);
  const chat = await transport.getChat(chatId);

  if (!['group', 'supergroup'].includes(chat?.type)) {
    fail('Selecione um grupo ou supergrupo do Telegram', 400);
  }

  const settings = await prisma.notificationSettings.update({
    where: { id: SETTINGS_ID },
    data: {
      enabled: false,
      telegramChatId: String(chat.id),
      telegramChatTitle: chat.title || 'Grupo sem titulo',
      telegramChatType: chat.type,
      telegramBotId: String(bot.id),
      telegramBotUsername: bot.username,
      botVerifiedAt: new Date(),
      channelVerifiedAt: new Date()
    },
    include: { accessLeadDays: { orderBy: { days: 'desc' } } }
  });

  return serializeNotificationSettings(settings, transport).telegram;
}

export async function disconnectTelegramGroup() {
  const settings = await prisma.notificationSettings.update({
    where: { id: SETTINGS_ID },
    data: {
      enabled: false,
      telegramChatId: null,
      telegramChatTitle: null,
      telegramChatType: null,
      channelVerifiedAt: null
    },
    include: { accessLeadDays: { orderBy: { days: 'desc' } } }
  });

  return serializeNotificationSettings(settings).telegram;
}

function demandDeadline(record, today) {
  if (!record.dueDate) {
    return { group: 'NoDate', deadlineLabel: 'Sem prazo definido', sortDays: 999999 };
  }

  const dueDay = record.dueDate.toISOString().slice(0, 10);
  const days = differenceInCivilDays(dueDay, today);
  if (days < 0) {
    return { group: 'Urgent', deadlineLabel: `${Math.abs(days)} dia(s) em atraso`, sortDays: days };
  }
  if (days === 0) {
    return { group: 'Urgent', deadlineLabel: 'Vence hoje', sortDays: 0 };
  }
  return { group: 'Active', deadlineLabel: `${days} dia(s) restante(s)`, sortDays: days };
}

export async function selectDemandReportRecords(plannedDay) {
  const demands = await prisma.productionDemand.findMany({
    where: { status: { in: ACTIVE_DEMAND_STATUSES } },
    include: { project: { select: { name: true } } }
  });

  return demands
    .map((record) => ({
      id: record.id,
      type: record.type,
      code: record.code,
      title: record.title,
      projectName: record.project.name,
      qaOwner: record.qaOwner,
      supportContact: record.supportContact,
      criticality: record.criticality,
      affectedUsersCount: record.affectedUsersCount,
      ...demandDeadline(record, plannedDay)
    }))
    .sort(
      (left, right) =>
        ({ Urgent: 0, NoDate: 1, Active: 2 }[left.group] -
          { Urgent: 0, NoDate: 1, Active: 2 }[right.group]) ||
        left.sortDays - right.sortDays ||
        left.projectName.localeCompare(right.projectName, 'pt-BR') ||
        left.code.localeCompare(right.code, 'pt-BR')
    );
}

export async function selectAccessReportRecords(plannedDay, leadDays) {
  const thirdParties = await prisma.thirdParty.findMany({
    where: { archivedAt: null },
    include: {
      cycles: {
        where: { closedAt: null },
        include: { grants: { orderBy: { system: 'asc' } } },
        take: 1
      }
    }
  });

  return thirdParties
    .flatMap((thirdParty) => {
      const cycle = thirdParty.cycles[0];
      if (!cycle) return [];
      const expiresDay = cycle.expiresAt.toISOString().slice(0, 10);
      const daysRemaining = differenceInCivilDays(expiresDay, plannedDay);
      if (daysRemaining > 0 && !leadDays.includes(daysRemaining)) return [];

      return [{
        id: thirdParty.id,
        name: thirdParty.name,
        company: thirdParty.company,
        internalOwner: thirdParty.internalOwner,
        systems: cycle.grants.map((grant) => grant.system),
        expiresDay,
        daysRemaining,
        deadlineLabel:
          daysRemaining < 0
            ? `${Math.abs(daysRemaining)} dia(s) vencido`
            : daysRemaining === 0
              ? 'Vence hoje'
              : `${daysRemaining} dia(s) restante(s)`
      }];
    })
    .sort(
      (left, right) =>
        left.daysRemaining - right.daysRemaining ||
        left.name.localeCompare(right.name, 'pt-BR')
    );
}

function deliverySnapshot(type, plannedDay, records, parts) {
  return JSON.stringify({
    version: 1,
    type,
    plannedDay,
    sourceCount: records.length,
    sourceIds: records.map((record) => record.id),
    parts
  });
}

async function createDeliveryRecord({
  type,
  trigger,
  plannedDay = null,
  dedupKey,
  records = [],
  parts = [],
  originalDeliveryId = null,
  settings
}) {
  const noData = records.length === 0 && type !== 'Test' && type !== 'Resend';

  try {
    return await prisma.notificationDelivery.create({
      data: {
        originalDeliveryId,
        type,
        trigger,
        plannedDay,
        status: noData ? 'NoData' : 'Pending',
        sourceCount: records.length,
        dedupKey,
        channelChatIdSnapshot: settings.telegramChatId,
        channelTitleSnapshot: settings.telegramChatTitle,
        channelTypeSnapshot: settings.telegramChatType,
        botUsernameSnapshot: settings.telegramBotUsername,
        payloadSnapshot: deliverySnapshot(type, plannedDay, records, parts),
        finishedAt: noData ? new Date() : null,
        parts: noData
          ? undefined
          : {
              create: parts.map((body, index) => ({
                position: index + 1,
                body,
                status: 'Pending'
              }))
            }
      },
      include: { parts: { orderBy: { position: 'asc' } } }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return prisma.notificationDelivery.findUnique({
        where: { dedupKey },
        include: { parts: { orderBy: { position: 'asc' } } }
      });
    }
    throw error;
  }
}

export async function createScheduledReport(
  type,
  plannedDay,
  trigger,
  { transport = createTelegramClient() } = {}
) {
  const settings = await getNotificationSettings();
  const records =
    type === 'DemandReport'
      ? await selectDemandReportRecords(plannedDay)
      : await selectAccessReportRecords(
          plannedDay,
          settings.accessLeadDays.map((item) => item.days)
        );
  const parts =
    records.length === 0
      ? []
      : type === 'DemandReport'
        ? renderDemandReport(records, plannedDay)
        : renderAccessReport(records, plannedDay);
  const delivery = await createDeliveryRecord({
    type,
    trigger,
    plannedDay,
    dedupKey: `${type}:${plannedDay}`,
    records,
    parts,
    settings
  });

  if (delivery.status === 'Pending' && channelReady(settings, transport)) {
    return processDelivery(delivery.id, { transport });
  }

  return delivery;
}

async function aggregateDelivery(deliveryId) {
  const parts = await prisma.notificationMessagePart.findMany({
    where: { deliveryId },
    select: { status: true, nextAttemptAt: true }
  });
  const failed = parts.find((part) => part.status === 'Failed');
  const pending = parts.find((part) => part.status !== 'Sent');
  const status = failed ? 'Failed' : pending ? 'Pending' : 'Sent';
  const latestError = failed
    ? await prisma.notificationAttempt.findFirst({
        where: { part: { deliveryId }, status: 'Failed' },
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }]
      })
    : null;

  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      status,
      safeErrorCode: latestError?.safeErrorCode || null,
      safeErrorMessage: latestError?.safeErrorMessage || null,
      finishedAt: status === 'Sent' || status === 'Failed' ? new Date() : null
    }
  });
}

async function sendPart(part, chatId, transport, now) {
  const attemptNumber = (part.attempts[0]?.attemptNumber || 0) + 1;
  const attempt = await prisma.notificationAttempt.create({
    data: {
      partId: part.id,
      attemptNumber,
      status: 'Processing',
      startedAt: now
    }
  });

  try {
    const result = await transport.sendMessage(chatId, part.body);
    const messageId = String(result.message_id);
    await prisma.$transaction([
      prisma.notificationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'Sent',
          telegramMessageId: messageId,
          finishedAt: new Date()
        }
      }),
      prisma.notificationMessagePart.update({
        where: { id: part.id },
        data: {
          status: 'Sent',
          telegramMessageId: messageId,
          sentAt: new Date(),
          nextAttemptAt: null
        }
      })
    ]);
  } catch (error) {
    const safe = safeTelegramError(error);
    const retryDelay = RETRY_DELAYS_MS[attemptNumber - 1];
    const nextRetryAt = retryDelay ? new Date(now.getTime() + retryDelay) : null;
    await prisma.$transaction([
      prisma.notificationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'Failed',
          httpStatus: safe.httpStatus,
          safeErrorCode: safe.code,
          safeErrorMessage: safe.message,
          finishedAt: new Date(),
          nextRetryAt
        }
      }),
      prisma.notificationMessagePart.update({
        where: { id: part.id },
        data: {
          status: retryDelay ? 'Pending' : 'Failed',
          nextAttemptAt: nextRetryAt
        }
      })
    ]);
  }
}

export async function processDelivery(
  deliveryId,
  { now = new Date(), transport = createTelegramClient() } = {}
) {
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      parts: {
        orderBy: { position: 'asc' },
        include: {
          attempts: { orderBy: { attemptNumber: 'desc' }, take: 1 }
        }
      }
    }
  });

  if (!delivery) fail('Entrega nao encontrada', 404);
  if (!delivery.channelChatIdSnapshot) fail('Entrega sem grupo de destino', 409);

  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: { status: 'Processing', startedAt: delivery.startedAt || now }
  });

  for (const part of delivery.parts) {
    if (
      part.status === 'Pending' &&
      (!part.nextAttemptAt || part.nextAttemptAt <= now)
    ) {
      await sendPart(part, delivery.channelChatIdSnapshot, transport, now);
    }
  }

  await aggregateDelivery(deliveryId);
  return getNotificationDelivery(deliveryId);
}

export async function processDueNotificationDeliveries({
  now = new Date(),
  transport = createTelegramClient()
} = {}) {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: { in: ['Pending', 'Processing'] },
      parts: {
        some: {
          status: 'Pending',
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }]
        }
      }
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true }
  });

  for (const delivery of deliveries) {
    await processDelivery(delivery.id, { now, transport });
  }
}

export async function createTestDelivery({ transport = createTelegramClient() } = {}) {
  const settings = await getNotificationSettings();
  if (!channelReady(settings, transport)) {
    fail('Valide o token e conecte um grupo antes de testar o canal', 409);
  }
  const day = civilDate(new Date(), settings.timeZone);
  const parts = [
    '<b>QaBase | Canal conectado</b>\nTeste concluido. Este grupo recebera os relatorios configurados.'
  ];
  const delivery = await createDeliveryRecord({
    type: 'Test',
    trigger: 'Manual',
    plannedDay: day,
    dedupKey: `Test:${randomUUID()}`,
    records: [{ id: 'channel-test' }],
    parts,
    settings
  });
  return processDelivery(delivery.id, { transport });
}

export async function resendNotificationDelivery(
  id,
  { transport = createTelegramClient() } = {}
) {
  const original = await prisma.notificationDelivery.findUnique({ where: { id } });
  if (!original) fail('Entrega nao encontrada', 404);
  if (original.status === 'NoData') {
    fail('Execucoes sem dados nao possuem mensagem para reenviar', 409);
  }
  const snapshot = JSON.parse(original.payloadSnapshot);
  if (!snapshot.parts?.length) fail('A entrega nao possui conteudo para reenviar', 409);
  const settings = await getNotificationSettings();
  if (!channelReady(settings, transport)) {
    fail('O canal do Telegram nao esta pronto para reenvio', 409);
  }
  const delivery = await createDeliveryRecord({
    type: 'Resend',
    trigger: 'ManualResend',
    plannedDay: original.plannedDay,
    dedupKey: `Resend:${id}:${randomUUID()}`,
    records: Array.from({ length: original.sourceCount }, (_, index) => ({ id: index })),
    parts: snapshot.parts,
    originalDeliveryId: id,
    settings
  });
  return processDelivery(delivery.id, { transport });
}

export async function runNotificationSchedulerTick({
  now = new Date(),
  transport = createTelegramClient()
} = {}) {
  await processDueNotificationDeliveries({ now, transport });
  const settings = await getNotificationSettings();
  if (!settings.enabled || !channelReady(settings, transport)) return;
  const today = civilDate(now, settings.timeZone);
  if (!scheduleHasPassed(now, settings.timeZone, settings.sendTime)) return;

  for (const report of [
    {
      type: 'DemandReport',
      field: 'nextDemandReportDay',
      cadence: settings.demandCadenceDays
    },
    { type: 'AccessReport', field: 'nextAccessReportDay', cadence: 1 }
  ]) {
    const firstDay =
      settings[report.field] || initialPlannedDay(now, settings.timeZone, settings.sendTime);
    if (firstDay > today) continue;
    const plannedDay = latestDueDay(firstDay, today, report.cadence);
    const trigger = plannedDay === firstDay ? 'Scheduled' : 'CatchUp';
    await createScheduledReport(report.type, plannedDay, trigger, { transport });
    await prisma.notificationSettings.update({
      where: { id: SETTINGS_ID },
      data: { [report.field]: nextFutureDay(plannedDay, today, report.cadence) }
    });
  }
}

export async function listNotificationDeliveries(filters = {}) {
  const where = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.trigger ? { trigger: filters.trigger } : {})
  };
  const [items, total] = await Promise.all([
    prisma.notificationDelivery.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        _count: { select: { parts: true } },
        parts: {
          select: { _count: { select: { attempts: true } } }
        }
      }
    }),
    prisma.notificationDelivery.count({ where })
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      partCount: item._count.parts,
      attemptCount: item.parts.reduce((totalCount, part) => totalCount + part._count.attempts, 0),
      parts: undefined,
      _count: undefined
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize))
  };
}

export async function getNotificationDelivery(id) {
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id },
    include: {
      originalDelivery: {
        select: { id: true, type: true, status: true, createdAt: true }
      },
      resends: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      },
      parts: {
        orderBy: { position: 'asc' },
        include: { attempts: { orderBy: { attemptNumber: 'asc' } } }
      }
    }
  });

  if (!delivery) fail('Entrega nao encontrada', 404);
  return delivery;
}

export async function getNotificationOverview(transport = createTelegramClient()) {
  const settings = await getNotificationSettings();
  const [latestDelivery, latestFailure, totals] = await Promise.all([
    prisma.notificationDelivery.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.notificationDelivery.findFirst({
      where: { status: 'Failed' },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notificationDelivery.groupBy({
      by: ['status'],
      _count: { _all: true }
    })
  ]);

  return {
    settings: serializeNotificationSettings(settings, transport),
    latestDelivery,
    latestFailure,
    totals: Object.fromEntries(totals.map((item) => [item.status, item._count._all]))
  };
}
