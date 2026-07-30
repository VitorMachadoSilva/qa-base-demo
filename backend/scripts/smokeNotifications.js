import assert from 'node:assert/strict';
import { prisma } from '../src/db/client.js';
import {
  confirmTelegramGroup,
  createScheduledReport,
  createTestDelivery,
  discoverTelegramGroups,
  getNotificationDelivery,
  getNotificationOverview,
  getNotificationSettings,
  listNotificationDeliveries,
  processDelivery,
  resendNotificationDelivery,
  runNotificationSchedulerTick,
  serializeNotificationSettings,
  updateNotificationSettings
} from '../src/services/notificationService.js';
import {
  escapeTelegramHtml,
  partitionMessage
} from '../src/services/notificationRenderer.js';
import {
  addCivilDays,
  civilDate,
  differenceInCivilDays,
  isValidTimeZone
} from '../src/services/notificationTime.js';

const FAKE_TOKEN = '123456:notification-smoke-secret';
const startedAt = new Date();

function fakeTransport({ alwaysFail = false, failOnCalls = [] } = {}) {
  let calls = 0;
  return {
    configured: true,
    get calls() {
      return calls;
    },
    async getMe() {
      return { id: 987654, username: 'qabase_smoke_bot', is_bot: true };
    },
    async getUpdates() {
      return [{
        update_id: 41,
        message: {
          date: Math.floor(Date.parse('2099-01-10T12:00:00Z') / 1000),
          text: '/connect@qabase_smoke_bot',
          chat: { id: -100777, title: 'QaBase Smoke', type: 'supergroup' }
        }
      }];
    },
    async getChat(chatId) {
      return { id: chatId, title: 'QaBase Smoke', type: 'supergroup' };
    },
    async sendMessage() {
      calls += 1;
      if (alwaysFail || failOnCalls.includes(calls)) {
        const error = new Error('Falha simulada');
        error.code = 'SIMULATED_FAILURE';
        throw error;
      }
      return { message_id: 1000 + calls };
    }
  };
}

async function restoreSettings(snapshot) {
  await prisma.$transaction(async (transaction) => {
    await transaction.notificationAccessLeadDay.deleteMany({ where: { settingsId: 1 } });
    await transaction.notificationSettings.update({
      where: { id: 1 },
      data: {
        enabled: snapshot.enabled,
        timeZone: snapshot.timeZone,
        sendTime: snapshot.sendTime,
        demandCadenceDays: snapshot.demandCadenceDays,
        telegramChatId: snapshot.telegramChatId,
        telegramChatTitle: snapshot.telegramChatTitle,
        telegramChatType: snapshot.telegramChatType,
        telegramBotId: snapshot.telegramBotId,
        telegramBotUsername: snapshot.telegramBotUsername,
        botVerifiedAt: snapshot.botVerifiedAt,
        channelVerifiedAt: snapshot.channelVerifiedAt,
        nextDemandReportDay: snapshot.nextDemandReportDay,
        nextAccessReportDay: snapshot.nextAccessReportDay,
        lastDiscoveryUpdateId: snapshot.lastDiscoveryUpdateId
      }
    });
    await transaction.notificationAccessLeadDay.createMany({
      data: snapshot.accessLeadDays.map(({ days }) => ({ settingsId: 1, days }))
    });
  });
}

async function main() {
  const originalSettings = await getNotificationSettings();
  const originalDeliveryIds = (
    await prisma.notificationDelivery.findMany({ select: { id: true } })
  ).map((item) => item.id);
  let temporaryProjectId = null;

  try {
    assert.equal(isValidTimeZone('America/Sao_Paulo'), true);
    assert.equal(isValidTimeZone('Invalid/Zone'), false);
    assert.equal(addCivilDays('2099-01-31', 1), '2099-02-01');
    assert.equal(differenceInCivilDays('2099-02-02', '2099-02-01'), 1);
    assert.equal(civilDate(new Date('2099-01-10T12:00:00Z'), 'America/Sao_Paulo'), '2099-01-10');
    assert.equal(escapeTelegramHtml('<Qa&Base>'), '&lt;Qa&amp;Base&gt;');
    const renderedParts = partitionMessage(
      '<b>QaBase</b>',
      Array.from({ length: 80 }, (_, index) => `Registro ${index}: ${'x'.repeat(90)}`)
    );
    assert.ok(renderedParts.length > 1);
    assert.ok(renderedParts.every((part) => part.length < 4096));

    const transport = fakeTransport();
    const discovery = await discoverTelegramGroups({
      now: new Date('2099-01-10T12:05:00Z'),
      transport
    });
    assert.equal(discovery.candidates.length, 1);
    assert.equal(discovery.candidates[0].chatId, '-100777');

    await confirmTelegramGroup('-100777', { transport });
    const connected = await getNotificationSettings();
    assert.equal(connected.telegramChatTitle, 'QaBase Smoke');

    const noData = await createScheduledReport(
      'AccessReport',
      '1900-01-01',
      'Scheduled',
      { transport }
    );
    assert.equal(noData.status, 'NoData');
    const duplicate = await createScheduledReport(
      'AccessReport',
      '1900-01-01',
      'Scheduled',
      { transport }
    );
    assert.equal(duplicate.id, noData.id);

    const testDelivery = await createTestDelivery({ transport });
    assert.equal(testDelivery.status, 'Sent');
    assert.equal(testDelivery.parts[0].attempts.length, 1);

    const failingTransport = fakeTransport({ alwaysFail: true });
    let failedTest = await createTestDelivery({ transport: failingTransport });
    for (let retry = 0; retry < 3; retry += 1) {
      const nextAttemptAt = failedTest.parts[0].nextAttemptAt;
      assert.ok(nextAttemptAt);
      failedTest = await processDelivery(failedTest.id, {
        now: new Date(nextAttemptAt),
        transport: failingTransport
      });
    }
    assert.equal(failedTest.status, 'Failed');
    assert.equal(failedTest.parts[0].attempts.length, 4);

    const project = await prisma.project.create({
      data: { name: `Notification Smoke ${Date.now()}`, description: 'Temporario' }
    });
    temporaryProjectId = project.id;
    await prisma.productionDemand.createMany({
      data: Array.from({ length: 48 }, (_, index) => ({
        projectId: project.id,
        type: 'AD',
        code: `SMOKE-${String(index + 1).padStart(3, '0')}`,
        normalizedCode: `SMOKE-${String(index + 1).padStart(3, '0')}`,
        title: `Cenario temporario ${index + 1} ${'conteudo '.repeat(12)}`,
        supportContact: 'Suporte Smoke',
        qaOwner: 'QA Smoke',
        status: 'Open',
        registeredAt: new Date('2099-02-01T00:00:00Z'),
        criticality: index % 2 ? 'High' : 'Medium',
        affectedUsersCount: index + 1
      }))
    });

    const partialTransport = fakeTransport({ failOnCalls: [2] });
    let multipart = await createScheduledReport(
      'DemandReport',
      '2099-02-02',
      'Scheduled',
      { transport: partialTransport }
    );
    assert.ok(multipart.parts.length > 1);
    assert.equal(multipart.parts.filter((part) => part.status === 'Sent').length, multipart.parts.length - 1);
    const failedPart = multipart.parts.find((part) => part.status === 'Pending');
    multipart = await processDelivery(multipart.id, {
      now: new Date(failedPart.nextAttemptAt),
      transport: partialTransport
    });
    assert.equal(multipart.status, 'Sent');
    assert.equal(multipart.parts.filter((part) => part.attempts.length === 2).length, 1);

    const resent = await resendNotificationDelivery(multipart.id, { transport });
    assert.equal(resent.status, 'Sent');
    assert.equal(resent.originalDeliveryId, multipart.id);
    assert.equal(resent.parts.length, multipart.parts.length);

    await updateNotificationSettings(
      {
        enabled: true,
        timeZone: 'America/Sao_Paulo',
        sendTime: '09:00',
        demandCadenceDays: 2,
        accessLeadDays: [7, 2]
      },
      { now: new Date('2099-03-10T12:00:00Z'), transport }
    );
    await prisma.notificationSettings.update({
      where: { id: 1 },
      data: {
        nextDemandReportDay: '2099-03-01',
        nextAccessReportDay: '2099-03-01'
      }
    });
    await runNotificationSchedulerTick({
      now: new Date('2099-03-10T13:05:00Z'),
      transport
    });
    const afterCatchUp = await getNotificationSettings();
    assert.ok(afterCatchUp.nextDemandReportDay > '2099-03-10');
    assert.ok(afterCatchUp.nextAccessReportDay > '2099-03-10');
    const catchUps = await prisma.notificationDelivery.count({
      where: {
        trigger: 'CatchUp',
        type: { in: ['DemandReport', 'AccessReport'] },
        plannedDay: { in: ['2099-03-09', '2099-03-10'] }
      }
    });
    assert.equal(catchUps, 2);

    const history = await listNotificationDeliveries({
      page: 1,
      pageSize: 100
    });
    assert.ok(history.total >= 7);
    const detail = await getNotificationDelivery(multipart.id);
    assert.ok(detail.payloadSnapshot.includes('"parts"'));

    const safeState = JSON.stringify({
      overview: await getNotificationOverview(transport),
      settings: serializeNotificationSettings(await getNotificationSettings(), transport),
      deliveries: await prisma.notificationDelivery.findMany(),
      attempts: await prisma.notificationAttempt.findMany()
    });
    assert.equal(safeState.includes(FAKE_TOKEN), false);

    console.log(
      JSON.stringify(
        {
          discovery: 'ok',
          noData: 'ok',
          deduplication: 'ok',
          multipartParts: multipart.parts.length,
          retryAttempts: failedTest.parts[0].attempts.length,
          partialRetry: 'ok',
          catchUpDeliveries: catchUps,
          resend: 'ok',
          secretSafety: 'ok'
        },
        null,
        2
      )
    );
  } finally {
    await prisma.notificationDelivery.deleteMany({
      where: originalDeliveryIds.length ? { id: { notIn: originalDeliveryIds } } : {}
    });
    if (temporaryProjectId) {
      await prisma.project.delete({ where: { id: temporaryProjectId } }).catch(() => {});
    }
    await restoreSettings(originalSettings);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
