import { prisma } from './client.js';
import 'dotenv/config';
import { bootstrapFixedAccounts } from '../auth/fixedAccounts.js';
import { configureDatabaseRuntime } from './runtime.js';

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "passwordNoticeSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Suite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Suite_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Suite_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Suite" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TestCase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "suiteId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "preconditions" TEXT,
    "steps" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "type" TEXT NOT NULL DEFAULT 'Functional',
    "severity" TEXT NOT NULL DEFAULT 'Normal',
    "automationStatus" TEXT NOT NULL DEFAULT 'Manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestCase_suiteId_fkey"
      FOREIGN KEY ("suiteId") REFERENCES "Suite" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TestStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "testCaseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestStep_testCaseId_fkey"
      FOREIGN KEY ("testCaseId") REFERENCES "TestCase" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TestComponent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestComponent_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TestCaseComponent" (
    "testCaseId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("testCaseId", "componentId"),
    CONSTRAINT "TestCaseComponent_testCaseId_fkey"
      FOREIGN KEY ("testCaseId") REFERENCES "TestCase" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestCaseComponent_componentId_fkey"
      FOREIGN KEY ("componentId") REFERENCES "TestComponent" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TestPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestPlan_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TestPlanSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "testPlanId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestPlanSection_testPlanId_fkey"
      FOREIGN KEY ("testPlanId") REFERENCES "TestPlan" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  createTestPlanItemTable('"TestPlanItem"'),
  `CREATE TABLE IF NOT EXISTS "Milestone" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Milestone_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Environment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Environment_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ConfigurationGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConfigurationGroup_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ConfigurationOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConfigurationOption_groupId_fkey"
      FOREIGN KEY ("groupId") REFERENCES "ConfigurationGroup" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ValidationFolder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationFolder_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ValidationFolder_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "ValidationFolder" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ValidationBrief" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "folderId" INTEGER,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "objective" TEXT,
    "scope" TEXT,
    "generalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationBrief_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ValidationBrief_folderId_fkey"
      FOREIGN KEY ("folderId") REFERENCES "ValidationFolder" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ValidationCriterion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "briefId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isMet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationCriterion_briefId_fkey"
      FOREIGN KEY ("briefId") REFERENCES "ValidationBrief" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ValidationCheck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "briefId" INTEGER NOT NULL,
    "testCaseId" INTEGER,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "actualResult" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Untested',
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationCheck_briefId_fkey"
      FOREIGN KEY ("briefId") REFERENCES "ValidationBrief" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ValidationCheck_testCaseId_fkey"
      FOREIGN KEY ("testCaseId") REFERENCES "TestCase" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ValidationNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "briefId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Note',
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationNote_briefId_fkey"
      FOREIGN KEY ("briefId") REFERENCES "ValidationBrief" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Run" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "testPlanId" INTEGER,
    "milestoneId" INTEGER,
    "environmentId" INTEGER,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "snapshotPlanName" TEXT,
    "snapshotMilestoneName" TEXT,
    "snapshotEnvironmentName" TEXT,
    "snapshotEnvironmentTarget" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Run_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Run_testPlanId_fkey"
      FOREIGN KEY ("testPlanId") REFERENCES "TestPlan" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Run_milestoneId_fkey"
      FOREIGN KEY ("milestoneId") REFERENCES "Milestone" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Run_environmentId_fkey"
      FOREIGN KEY ("environmentId") REFERENCES "Environment" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ProductionDemand" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "normalizedCode" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "supportContact" TEXT NOT NULL,
    "qaOwner" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "registeredAt" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "criticality" TEXT,
    "affectedUsersCount" INTEGER,
    "workaroundSummary" TEXT,
    "workaroundDeliveredAt" DATETIME,
    "resolutionSummary" TEXT,
    "productionVersion" TEXT,
    "productionReleasedAt" DATETIME,
    "closureReason" TEXT,
    "closedAt" DATETIME,
    "validationBriefId" INTEGER,
    "runId" INTEGER,
    "milestoneId" INTEGER,
    "linkedAdId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionDemand_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductionDemand_validationBriefId_fkey"
      FOREIGN KEY ("validationBriefId") REFERENCES "ValidationBrief" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionDemand_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "Run" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionDemand_milestoneId_fkey"
      FOREIGN KEY ("milestoneId") REFERENCES "Milestone" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionDemand_linkedAdId_fkey"
      FOREIGN KEY ("linkedAdId") REFERENCES "ProductionDemand" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ProductionDemandActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT,
    "previousState" TEXT,
    "nextState" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionDemandActivity_demandId_fkey"
      FOREIGN KEY ("demandId") REFERENCES "ProductionDemand" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ThirdParty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "normalizedCompany" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contact" TEXT,
    "internalOwner" TEXT NOT NULL,
    "notes" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "ThirdPartyAccessCycle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "thirdPartyId" INTEGER NOT NULL,
    "approvedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "closureKind" TEXT,
    "closureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThirdPartyAccessCycle_thirdPartyId_fkey"
      FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ThirdPartyAccessGrant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cycleId" INTEGER NOT NULL,
    "system" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThirdPartyAccessGrant_cycleId_fkey"
      FOREIGN KEY ("cycleId") REFERENCES "ThirdPartyAccessCycle" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ThirdPartyAccessActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "thirdPartyId" INTEGER NOT NULL,
    "cycleId" INTEGER,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThirdPartyAccessActivity_thirdPartyId_fkey"
      FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ThirdPartyAccessActivity_cycleId_fkey"
      FOREIGN KEY ("cycleId") REFERENCES "ThirdPartyAccessCycle" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "QuickNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'Paper',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdDay" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuickNote_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "NotificationSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "timeZone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "sendTime" TEXT NOT NULL DEFAULT '09:00',
    "demandCadenceDays" INTEGER NOT NULL DEFAULT 2,
    "telegramChatId" TEXT,
    "telegramChatTitle" TEXT,
    "telegramChatType" TEXT,
    "telegramBotId" TEXT,
    "telegramBotUsername" TEXT,
    "botVerifiedAt" DATETIME,
    "channelVerifiedAt" DATETIME,
    "nextDemandReportDay" TEXT,
    "nextAccessReportDay" TEXT,
    "lastDiscoveryUpdateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "NotificationAccessLeadDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "settingsId" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationAccessLeadDay_settingsId_fkey"
      FOREIGN KEY ("settingsId") REFERENCES "NotificationSettings" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalDeliveryId" INTEGER,
    "type" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "plannedDay" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "dedupKey" TEXT NOT NULL,
    "channelChatIdSnapshot" TEXT,
    "channelTitleSnapshot" TEXT,
    "channelTypeSnapshot" TEXT,
    "botUsernameSnapshot" TEXT,
    "payloadSnapshot" TEXT NOT NULL,
    "safeErrorCode" TEXT,
    "safeErrorMessage" TEXT,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationDelivery_originalDeliveryId_fkey"
      FOREIGN KEY ("originalDeliveryId") REFERENCES "NotificationDelivery" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "NotificationMessagePart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deliveryId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "telegramMessageId" TEXT,
    "sentAt" DATETIME,
    "nextAttemptAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationMessagePart_deliveryId_fkey"
      FOREIGN KEY ("deliveryId") REFERENCES "NotificationDelivery" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "NotificationAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "safeErrorCode" TEXT,
    "safeErrorMessage" TEXT,
    "telegramMessageId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "nextRetryAt" DATETIME,
    CONSTRAINT "NotificationAttempt_partId_fkey"
      FOREIGN KEY ("partId") REFERENCES "NotificationMessagePart" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "RunPlanSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunPlanSection_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "Run" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  createRunTestCaseTable('"RunTestCase"'),
  `CREATE TABLE IF NOT EXISTS "RunConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "optionId" INTEGER,
    "position" INTEGER NOT NULL,
    "snapshotGroupName" TEXT NOT NULL,
    "snapshotOptionName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunConfiguration_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "Run" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunConfiguration_optionId_fkey"
      FOREIGN KEY ("optionId") REFERENCES "ConfigurationOption" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`
];

const runTestCaseColumns = [
  'id',
  'runId',
  'testCaseId',
  'runPlanSectionId',
  'position',
  'transitionInstructions',
  'dependsOnRunTestCaseId',
  'status',
  'comment',
  'actualResult',
  'evidence',
  'defectLink',
  'executor',
  'durationSeconds',
  'snapshotTitle',
  'snapshotPreconditions',
  'snapshotSteps',
  'snapshotExpectedResult',
  'snapshotPriority',
  'snapshotType',
  'snapshotSeverity',
  'snapshotAutomationStatus',
  'executedAt',
  'createdAt',
  'updatedAt'
];

function createTestPlanItemTable(tableName) {
  return `CREATE TABLE IF NOT EXISTS ${tableName} (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "testPlanId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "testCaseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "transitionInstructions" TEXT,
    "dependsOnItemId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestPlanItem_testPlanId_fkey"
      FOREIGN KEY ("testPlanId") REFERENCES "TestPlan" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestPlanItem_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "TestPlanSection" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestPlanItem_testCaseId_fkey"
      FOREIGN KEY ("testCaseId") REFERENCES "TestCase" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestPlanItem_dependsOnItemId_fkey"
      FOREIGN KEY ("dependsOnItemId") REFERENCES "TestPlanItem" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`;
}

function createRunTestCaseTable(tableName) {
  return `CREATE TABLE IF NOT EXISTS ${tableName} (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "testCaseId" INTEGER,
    "runPlanSectionId" INTEGER,
    "position" INTEGER NOT NULL,
    "transitionInstructions" TEXT,
    "dependsOnRunTestCaseId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Untested',
    "comment" TEXT,
    "actualResult" TEXT,
    "evidence" TEXT,
    "defectLink" TEXT,
    "executor" TEXT,
    "durationSeconds" INTEGER,
    "snapshotTitle" TEXT,
    "snapshotPreconditions" TEXT,
    "snapshotSteps" TEXT,
    "snapshotExpectedResult" TEXT,
    "snapshotPriority" TEXT,
    "snapshotType" TEXT,
    "snapshotSeverity" TEXT,
    "snapshotAutomationStatus" TEXT,
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunTestCase_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "Run" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunTestCase_testCaseId_fkey"
      FOREIGN KEY ("testCaseId") REFERENCES "TestCase" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RunTestCase_runPlanSectionId_fkey"
      FOREIGN KEY ("runPlanSectionId") REFERENCES "RunPlanSection" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RunTestCase_dependsOnRunTestCaseId_fkey"
      FOREIGN KEY ("dependsOnRunTestCaseId") REFERENCES "RunTestCase" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )`;
}

async function getColumns(tableName) {
  return prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await getColumns(tableName);

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`
  );
}

async function ensureQuickNoteOwnershipShape() {
  const columns = await getColumns('QuickNote');

  if (columns.some((column) => column.name === 'ownerId')) {
    return;
  }

  await prisma.$executeRawUnsafe('DELETE FROM "QuickNote"');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "new_QuickNote"');
  await prisma.$executeRawUnsafe(
    `CREATE TABLE "new_QuickNote" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "ownerId" INTEGER NOT NULL,
      "title" TEXT,
      "content" TEXT NOT NULL,
      "color" TEXT NOT NULL DEFAULT 'Paper',
      "pinned" BOOLEAN NOT NULL DEFAULT false,
      "createdDay" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "QuickNote_ownerId_fkey"
        FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )`
  );
  await prisma.$executeRawUnsafe('DROP TABLE "QuickNote"');
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "new_QuickNote" RENAME TO "QuickNote"'
  );
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
}

async function ensureDefaultPlanSections() {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "TestPlanSection" (
      "testPlanId",
      "name",
      "position"
    )
    SELECT
      plan."id",
      'Casos do plano',
      1
    FROM "TestPlan" AS plan
    WHERE NOT EXISTS (
      SELECT 1
      FROM "TestPlanSection" AS section
      WHERE section."testPlanId" = plan."id"
    )`
  );
}

async function ensureTestPlanItemShape() {
  const columns = await getColumns('TestPlanItem');
  const existingColumnNames = new Set(columns.map((column) => column.name));
  const requiredColumns = [
    'sectionId',
    'transitionInstructions',
    'dependsOnItemId'
  ];

  if (requiredColumns.every((column) => existingColumnNames.has(column))) {
    return;
  }

  await ensureDefaultPlanSections();
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "new_TestPlanItem"');
  await prisma.$executeRawUnsafe(createTestPlanItemTable('"new_TestPlanItem"'));
  await prisma.$executeRawUnsafe(
    `INSERT INTO "new_TestPlanItem" (
      "id",
      "testPlanId",
      "sectionId",
      "testCaseId",
      "position",
      "transitionInstructions",
      "dependsOnItemId",
      "createdAt",
      "updatedAt"
    )
    SELECT
      item."id",
      item."testPlanId",
      (
        SELECT section."id"
        FROM "TestPlanSection" AS section
        WHERE section."testPlanId" = item."testPlanId"
        ORDER BY section."position", section."id"
        LIMIT 1
      ),
      item."testCaseId",
      item."position",
      NULL,
      NULL,
      item."createdAt",
      item."updatedAt"
    FROM "TestPlanItem" AS item`
  );
  await prisma.$executeRawUnsafe('DROP TABLE "TestPlanItem"');
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "new_TestPlanItem" RENAME TO "TestPlanItem"'
  );
}

async function ensureDefaultRunSections() {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "RunPlanSection" (
      "runId",
      "name",
      "position"
    )
    SELECT
      run."id",
      'Casos do plano',
      1
    FROM "Run" AS run
    WHERE run."testPlanId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "RunPlanSection" AS section
        WHERE section."runId" = run."id"
      )`
  );
}

async function ensureRunTestCaseShape() {
  const columns = await getColumns('RunTestCase');
  const testCaseIdColumn = columns.find((column) => column.name === 'testCaseId');
  const existingColumnNames = new Set(columns.map((column) => column.name));
  const requiredColumns = [
    'runPlanSectionId',
    'position',
    'transitionInstructions',
    'dependsOnRunTestCaseId',
    'evidence',
    'defectLink',
    'executor'
  ];

  if (
    testCaseIdColumn &&
    Number(testCaseIdColumn.notnull) === 0 &&
    requiredColumns.every((column) => existingColumnNames.has(column))
  ) {
    return;
  }

  await ensureDefaultRunSections();
  const selectExpressions = runTestCaseColumns.map((column) => {
    if (existingColumnNames.has(column)) {
      return `item."${column}"`;
    }

    if (column === 'runPlanSectionId') {
      return `(
        SELECT section."id"
        FROM "RunPlanSection" AS section
        WHERE section."runId" = item."runId"
        ORDER BY section."position", section."id"
        LIMIT 1
      )`;
    }

    if (column === 'position') {
      return `(
        SELECT COUNT(*)
        FROM "RunTestCase" AS previous
        WHERE previous."runId" = item."runId"
          AND previous."id" <= item."id"
      )`;
    }

    return 'NULL';
  });
  const quotedColumns = runTestCaseColumns.map((column) => `"${column}"`).join(', ');

  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "new_RunTestCase"');
  await prisma.$executeRawUnsafe(createRunTestCaseTable('"new_RunTestCase"'));
  await prisma.$executeRawUnsafe(
    `INSERT INTO "new_RunTestCase" (${quotedColumns})
     SELECT ${selectExpressions.join(', ')}
     FROM "RunTestCase" AS item`
  );
  await prisma.$executeRawUnsafe('DROP TABLE "RunTestCase"');
  await prisma.$executeRawUnsafe('ALTER TABLE "new_RunTestCase" RENAME TO "RunTestCase"');
}

async function migrateLegacySteps() {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "TestStep" (
      "testCaseId",
      "position",
      "action",
      "expectedResult"
    )
    SELECT
      test_case."id",
      1,
      test_case."steps",
      test_case."expectedResult"
    FROM "TestCase" AS test_case
    WHERE trim(test_case."steps") <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM "TestStep" AS test_step
        WHERE test_step."testCaseId" = test_case."id"
      )`
  );
}

async function createIndexes() {
  const obsoleteIndexes = [
    'RunTestCase_runId_testCaseId_key',
    'TestPlanItem_testPlanId_testCaseId_key',
    'TestPlanItem_testPlanId_position_key'
  ];

  for (const indexName of obsoleteIndexes) {
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "${indexName}"`);
  }

  const statements = [
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
      ON "User" ("email")`,
    `CREATE INDEX IF NOT EXISTS "User_active_email_idx"
      ON "User" ("active", "email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key"
      ON "Session" ("tokenHash")`,
    `CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx"
      ON "Session" ("userId", "expiresAt")`,
    `CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx"
      ON "Session" ("expiresAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "RunTestCase_runPlanSectionId_position_key"
      ON "RunTestCase" ("runPlanSectionId", "position")`,
    `CREATE INDEX IF NOT EXISTS "RunTestCase_runId_status_idx"
      ON "RunTestCase" ("runId", "status")`,
    `CREATE INDEX IF NOT EXISTS "RunTestCase_runId_position_idx"
      ON "RunTestCase" ("runId", "position")`,
    `CREATE INDEX IF NOT EXISTS "RunTestCase_dependsOnRunTestCaseId_idx"
      ON "RunTestCase" ("dependsOnRunTestCaseId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TestStep_testCaseId_position_key"
      ON "TestStep" ("testCaseId", "position")`,
    `CREATE INDEX IF NOT EXISTS "Suite_projectId_parentId_idx"
      ON "Suite" ("projectId", "parentId")`,
    `CREATE INDEX IF NOT EXISTS "TestCase_suiteId_idx"
      ON "TestCase" ("suiteId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TestPlan_projectId_name_key"
      ON "TestPlan" ("projectId", "name")`,
    `CREATE INDEX IF NOT EXISTS "TestPlan_projectId_updatedAt_idx"
      ON "TestPlan" ("projectId", "updatedAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TestPlanSection_testPlanId_position_key"
      ON "TestPlanSection" ("testPlanId", "position")`,
    `CREATE INDEX IF NOT EXISTS "TestPlanSection_testPlanId_idx"
      ON "TestPlanSection" ("testPlanId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TestPlanItem_sectionId_position_key"
      ON "TestPlanItem" ("sectionId", "position")`,
    `CREATE INDEX IF NOT EXISTS "TestPlanItem_testPlanId_idx"
      ON "TestPlanItem" ("testPlanId")`,
    `CREATE INDEX IF NOT EXISTS "TestPlanItem_testCaseId_idx"
      ON "TestPlanItem" ("testCaseId")`,
    `CREATE INDEX IF NOT EXISTS "TestPlanItem_dependsOnItemId_idx"
      ON "TestPlanItem" ("dependsOnItemId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "RunPlanSection_runId_position_key"
      ON "RunPlanSection" ("runId", "position")`,
    `CREATE INDEX IF NOT EXISTS "RunPlanSection_runId_idx"
      ON "RunPlanSection" ("runId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TestComponent_projectId_normalizedName_key"
      ON "TestComponent" ("projectId", "normalizedName")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TestComponent_projectId_position_key"
      ON "TestComponent" ("projectId", "position")`,
    `CREATE INDEX IF NOT EXISTS "TestComponent_projectId_idx"
      ON "TestComponent" ("projectId")`,
    `CREATE INDEX IF NOT EXISTS "TestCaseComponent_componentId_idx"
      ON "TestCaseComponent" ("componentId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Milestone_projectId_name_key"
      ON "Milestone" ("projectId", "name")`,
    `CREATE INDEX IF NOT EXISTS "Milestone_projectId_status_idx"
      ON "Milestone" ("projectId", "status")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Environment_projectId_name_key"
      ON "Environment" ("projectId", "name")`,
    `CREATE INDEX IF NOT EXISTS "Environment_projectId_updatedAt_idx"
      ON "Environment" ("projectId", "updatedAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ConfigurationGroup_projectId_name_key"
      ON "ConfigurationGroup" ("projectId", "name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ConfigurationGroup_projectId_position_key"
      ON "ConfigurationGroup" ("projectId", "position")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ConfigurationOption_groupId_name_key"
      ON "ConfigurationOption" ("groupId", "name")`,
    `CREATE INDEX IF NOT EXISTS "ConfigurationOption_groupId_idx"
      ON "ConfigurationOption" ("groupId")`,
    `CREATE INDEX IF NOT EXISTS "Run_projectId_status_idx"
      ON "Run" ("projectId", "status")`,
    `CREATE INDEX IF NOT EXISTS "Run_projectId_testPlanId_idx"
      ON "Run" ("projectId", "testPlanId")`,
    `CREATE INDEX IF NOT EXISTS "Run_projectId_milestoneId_idx"
      ON "Run" ("projectId", "milestoneId")`,
    `CREATE INDEX IF NOT EXISTS "Run_projectId_environmentId_idx"
      ON "Run" ("projectId", "environmentId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "RunConfiguration_runId_position_key"
      ON "RunConfiguration" ("runId", "position")`,
    `CREATE INDEX IF NOT EXISTS "RunConfiguration_runId_idx"
      ON "RunConfiguration" ("runId")`,
    `CREATE INDEX IF NOT EXISTS "RunConfiguration_optionId_idx"
      ON "RunConfiguration" ("optionId")`,
    `CREATE INDEX IF NOT EXISTS "ValidationFolder_projectId_parentId_idx"
      ON "ValidationFolder" ("projectId", "parentId")`,
    `CREATE INDEX IF NOT EXISTS "ValidationBrief_projectId_folderId_idx"
      ON "ValidationBrief" ("projectId", "folderId")`,
    `CREATE INDEX IF NOT EXISTS "ValidationBrief_projectId_status_idx"
      ON "ValidationBrief" ("projectId", "status")`,
    `CREATE INDEX IF NOT EXISTS "ValidationBrief_projectId_updatedAt_idx"
      ON "ValidationBrief" ("projectId", "updatedAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ValidationCriterion_briefId_position_key"
      ON "ValidationCriterion" ("briefId", "position")`,
    `CREATE INDEX IF NOT EXISTS "ValidationCriterion_briefId_idx"
      ON "ValidationCriterion" ("briefId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ValidationCheck_briefId_position_key"
      ON "ValidationCheck" ("briefId", "position")`,
    `CREATE INDEX IF NOT EXISTS "ValidationCheck_briefId_status_idx"
      ON "ValidationCheck" ("briefId", "status")`,
    `CREATE INDEX IF NOT EXISTS "ValidationCheck_testCaseId_idx"
      ON "ValidationCheck" ("testCaseId")`,
    `CREATE INDEX IF NOT EXISTS "ValidationNote_briefId_createdAt_idx"
      ON "ValidationNote" ("briefId", "createdAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ProductionDemand_projectId_type_normalizedCode_key"
      ON "ProductionDemand" ("projectId", "type", "normalizedCode")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemand_projectId_status_dueDate_idx"
      ON "ProductionDemand" ("projectId", "status", "dueDate")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemand_projectId_type_criticality_idx"
      ON "ProductionDemand" ("projectId", "type", "criticality")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemand_projectId_qaOwner_idx"
      ON "ProductionDemand" ("projectId", "qaOwner")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemand_validationBriefId_idx"
      ON "ProductionDemand" ("validationBriefId")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemand_runId_idx"
      ON "ProductionDemand" ("runId")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemand_milestoneId_idx"
      ON "ProductionDemand" ("milestoneId")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemand_linkedAdId_idx"
      ON "ProductionDemand" ("linkedAdId")`,
    `CREATE INDEX IF NOT EXISTS "ProductionDemandActivity_demandId_createdAt_id_idx"
      ON "ProductionDemandActivity" ("demandId", "createdAt", "id")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ThirdParty_normalizedName_normalizedCompany_key"
      ON "ThirdParty" ("normalizedName", "normalizedCompany")`,
    `CREATE INDEX IF NOT EXISTS "ThirdParty_company_idx"
      ON "ThirdParty" ("company")`,
    `CREATE INDEX IF NOT EXISTS "ThirdParty_internalOwner_idx"
      ON "ThirdParty" ("internalOwner")`,
    `CREATE INDEX IF NOT EXISTS "ThirdParty_archivedAt_updatedAt_idx"
      ON "ThirdParty" ("archivedAt", "updatedAt")`,
    `CREATE INDEX IF NOT EXISTS "ThirdPartyAccessCycle_thirdPartyId_closedAt_expiresAt_idx"
      ON "ThirdPartyAccessCycle" ("thirdPartyId", "closedAt", "expiresAt")`,
    `CREATE INDEX IF NOT EXISTS "ThirdPartyAccessCycle_expiresAt_idx"
      ON "ThirdPartyAccessCycle" ("expiresAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ThirdPartyAccessCycle_one_current_idx"
      ON "ThirdPartyAccessCycle" ("thirdPartyId") WHERE "closedAt" IS NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ThirdPartyAccessGrant_cycleId_system_key"
      ON "ThirdPartyAccessGrant" ("cycleId", "system")`,
    `CREATE INDEX IF NOT EXISTS "ThirdPartyAccessGrant_system_idx"
      ON "ThirdPartyAccessGrant" ("system")`,
    `CREATE INDEX IF NOT EXISTS "ThirdPartyAccessActivity_thirdPartyId_createdAt_id_idx"
      ON "ThirdPartyAccessActivity" ("thirdPartyId", "createdAt", "id")`,
    `CREATE INDEX IF NOT EXISTS "ThirdPartyAccessActivity_cycleId_idx"
      ON "ThirdPartyAccessActivity" ("cycleId")`,
    `CREATE INDEX IF NOT EXISTS "QuickNote_ownerId_createdDay_pinned_updatedAt_idx"
      ON "QuickNote" ("ownerId", "createdDay", "pinned", "updatedAt")`,
    `CREATE INDEX IF NOT EXISTS "QuickNote_ownerId_pinned_updatedAt_idx"
      ON "QuickNote" ("ownerId", "pinned", "updatedAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationAccessLeadDay_settingsId_days_key"
      ON "NotificationAccessLeadDay" ("settingsId", "days")`,
    `CREATE INDEX IF NOT EXISTS "NotificationAccessLeadDay_settingsId_days_idx"
      ON "NotificationAccessLeadDay" ("settingsId", "days")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationDelivery_dedupKey_key"
      ON "NotificationDelivery" ("dedupKey")`,
    `CREATE INDEX IF NOT EXISTS "NotificationDelivery_type_plannedDay_idx"
      ON "NotificationDelivery" ("type", "plannedDay")`,
    `CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_createdAt_idx"
      ON "NotificationDelivery" ("status", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS "NotificationDelivery_originalDeliveryId_idx"
      ON "NotificationDelivery" ("originalDeliveryId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationMessagePart_deliveryId_position_key"
      ON "NotificationMessagePart" ("deliveryId", "position")`,
    `CREATE INDEX IF NOT EXISTS "NotificationMessagePart_status_nextAttemptAt_idx"
      ON "NotificationMessagePart" ("status", "nextAttemptAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationAttempt_partId_attemptNumber_key"
      ON "NotificationAttempt" ("partId", "attemptNumber")`,
    `CREATE INDEX IF NOT EXISTS "NotificationAttempt_partId_startedAt_idx"
      ON "NotificationAttempt" ("partId", "startedAt")`
  ];

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function setupDatabase() {
  await configureDatabaseRuntime();

  for (const statement of createTableStatements) {
    await prisma.$executeRawUnsafe(statement);
  }

  await bootstrapFixedAccounts(prisma);
  await ensureQuickNoteOwnershipShape();

  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "NotificationSettings" (
      "id", "enabled", "timeZone", "sendTime", "demandCadenceDays"
    ) VALUES (1, false, 'America/Sao_Paulo', '09:00', 2)`
  );
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "NotificationAccessLeadDay" ("settingsId", "days")
     VALUES (1, 7), (1, 2)`
  );

  await ensureColumn(
    'Suite',
    'parentId',
    'INTEGER REFERENCES "Suite" ("id") ON DELETE CASCADE ON UPDATE CASCADE'
  );
  await ensureColumn('TestCase', 'severity', "TEXT NOT NULL DEFAULT 'Normal'");
  await ensureColumn('TestCase', 'automationStatus', "TEXT NOT NULL DEFAULT 'Manual'");
  await ensureColumn(
    'Run',
    'testPlanId',
    'INTEGER REFERENCES "TestPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE'
  );
  await ensureColumn(
    'Run',
    'milestoneId',
    'INTEGER REFERENCES "Milestone" ("id") ON DELETE SET NULL ON UPDATE CASCADE'
  );
  await ensureColumn(
    'Run',
    'environmentId',
    'INTEGER REFERENCES "Environment" ("id") ON DELETE SET NULL ON UPDATE CASCADE'
  );
  await ensureColumn('Run', 'snapshotPlanName', 'TEXT');
  await ensureColumn('Run', 'snapshotMilestoneName', 'TEXT');
  await ensureColumn('Run', 'snapshotEnvironmentName', 'TEXT');
  await ensureColumn('Run', 'snapshotEnvironmentTarget', 'TEXT');
  await ensureColumn('Run', 'completedAt', 'DATETIME');

  await ensureDefaultPlanSections();
  await ensureTestPlanItemShape();
  await ensureRunTestCaseShape();
  await migrateLegacySteps();
  await createIndexes();

  const foreignKeyErrors = await prisma.$queryRawUnsafe('PRAGMA foreign_key_check');

  if (foreignKeyErrors.length > 0) {
    throw new Error('Falha de integridade ao atualizar o banco SQLite');
  }
}

setupDatabase()
  .then(async () => {
    console.log('SQLite database is ready.');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
