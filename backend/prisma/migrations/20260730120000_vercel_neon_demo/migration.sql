-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "passwordNoticeSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suite" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" SERIAL NOT NULL,
    "suiteId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "preconditions" TEXT,
    "steps" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "type" TEXT NOT NULL DEFAULT 'Functional',
    "severity" TEXT NOT NULL DEFAULT 'Normal',
    "automationStatus" TEXT NOT NULL DEFAULT 'Manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestStep" (
    "id" SERIAL NOT NULL,
    "testCaseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" SERIAL NOT NULL,
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
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunTestCase" (
    "id" SERIAL NOT NULL,
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
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPlan" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPlanItem" (
    "id" SERIAL NOT NULL,
    "testPlanId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "testCaseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "transitionInstructions" TEXT,
    "dependsOnItemId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPlanSection" (
    "id" SERIAL NOT NULL,
    "testPlanId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestPlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunPlanSection" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunPlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestComponent" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCaseComponent" (
    "testCaseId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestCaseComponent_pkey" PRIMARY KEY ("testCaseId","componentId")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Environment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigurationGroup" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigurationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigurationOption" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigurationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunConfiguration" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "optionId" INTEGER,
    "position" INTEGER NOT NULL,
    "snapshotGroupName" TEXT NOT NULL,
    "snapshotOptionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationFolder" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationBrief" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "folderId" INTEGER,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "objective" TEXT,
    "scope" TEXT,
    "generalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationCriterion" (
    "id" SERIAL NOT NULL,
    "briefId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isMet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationCheck" (
    "id" SERIAL NOT NULL,
    "briefId" INTEGER NOT NULL,
    "testCaseId" INTEGER,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "actualResult" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Untested',
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationNote" (
    "id" SERIAL NOT NULL,
    "briefId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Note',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionDemand" (
    "id" SERIAL NOT NULL,
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
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "criticality" TEXT,
    "affectedUsersCount" INTEGER,
    "workaroundSummary" TEXT,
    "workaroundDeliveredAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "productionVersion" TEXT,
    "productionReleasedAt" TIMESTAMP(3),
    "closureReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "validationBriefId" INTEGER,
    "runId" INTEGER,
    "milestoneId" INTEGER,
    "linkedAdId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionDemandActivity" (
    "id" SERIAL NOT NULL,
    "demandId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT,
    "previousState" TEXT,
    "nextState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionDemandActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdParty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "normalizedCompany" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contact" TEXT,
    "internalOwner" TEXT NOT NULL,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyAccessCycle" (
    "id" SERIAL NOT NULL,
    "thirdPartyId" INTEGER NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closureKind" TEXT,
    "closureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyAccessCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyAccessGrant" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "system" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThirdPartyAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyAccessActivity" (
    "id" SERIAL NOT NULL,
    "thirdPartyId" INTEGER NOT NULL,
    "cycleId" INTEGER,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThirdPartyAccessActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickNote" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'Paper',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdDay" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "timeZone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "sendTime" TEXT NOT NULL DEFAULT '09:00',
    "demandCadenceDays" INTEGER NOT NULL DEFAULT 2,
    "telegramChatId" TEXT,
    "telegramChatTitle" TEXT,
    "telegramChatType" TEXT,
    "telegramBotId" TEXT,
    "telegramBotUsername" TEXT,
    "botVerifiedAt" TIMESTAMP(3),
    "channelVerifiedAt" TIMESTAMP(3),
    "nextDemandReportDay" TEXT,
    "nextAccessReportDay" TEXT,
    "lastDiscoveryUpdateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAccessLeadDay" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAccessLeadDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" SERIAL NOT NULL,
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
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationMessagePart" (
    "id" SERIAL NOT NULL,
    "deliveryId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "telegramMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationMessagePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAttempt" (
    "id" SERIAL NOT NULL,
    "partId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "safeErrorCode" TEXT,
    "safeErrorMessage" TEXT,
    "telegramMessageId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_active_email_idx" ON "User"("active", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Project_ownerId_createdAt_idx" ON "Project"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Suite_projectId_parentId_idx" ON "Suite"("projectId", "parentId");

-- CreateIndex
CREATE INDEX "TestCase_suiteId_idx" ON "TestCase"("suiteId");

-- CreateIndex
CREATE UNIQUE INDEX "TestStep_testCaseId_position_key" ON "TestStep"("testCaseId", "position");

-- CreateIndex
CREATE INDEX "Run_projectId_status_idx" ON "Run"("projectId", "status");

-- CreateIndex
CREATE INDEX "Run_projectId_testPlanId_idx" ON "Run"("projectId", "testPlanId");

-- CreateIndex
CREATE INDEX "Run_projectId_milestoneId_idx" ON "Run"("projectId", "milestoneId");

-- CreateIndex
CREATE INDEX "Run_projectId_environmentId_idx" ON "Run"("projectId", "environmentId");

-- CreateIndex
CREATE INDEX "RunTestCase_runId_status_idx" ON "RunTestCase"("runId", "status");

-- CreateIndex
CREATE INDEX "RunTestCase_runId_position_idx" ON "RunTestCase"("runId", "position");

-- CreateIndex
CREATE INDEX "RunTestCase_dependsOnRunTestCaseId_idx" ON "RunTestCase"("dependsOnRunTestCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "RunTestCase_runPlanSectionId_position_key" ON "RunTestCase"("runPlanSectionId", "position");

-- CreateIndex
CREATE INDEX "TestPlan_projectId_updatedAt_idx" ON "TestPlan"("projectId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TestPlan_projectId_name_key" ON "TestPlan"("projectId", "name");

-- CreateIndex
CREATE INDEX "TestPlanItem_testPlanId_idx" ON "TestPlanItem"("testPlanId");

-- CreateIndex
CREATE INDEX "TestPlanItem_testCaseId_idx" ON "TestPlanItem"("testCaseId");

-- CreateIndex
CREATE INDEX "TestPlanItem_dependsOnItemId_idx" ON "TestPlanItem"("dependsOnItemId");

-- CreateIndex
CREATE UNIQUE INDEX "TestPlanItem_sectionId_position_key" ON "TestPlanItem"("sectionId", "position");

-- CreateIndex
CREATE INDEX "TestPlanSection_testPlanId_idx" ON "TestPlanSection"("testPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "TestPlanSection_testPlanId_position_key" ON "TestPlanSection"("testPlanId", "position");

-- CreateIndex
CREATE INDEX "RunPlanSection_runId_idx" ON "RunPlanSection"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "RunPlanSection_runId_position_key" ON "RunPlanSection"("runId", "position");

-- CreateIndex
CREATE INDEX "TestComponent_projectId_idx" ON "TestComponent"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "TestComponent_projectId_normalizedName_key" ON "TestComponent"("projectId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "TestComponent_projectId_position_key" ON "TestComponent"("projectId", "position");

-- CreateIndex
CREATE INDEX "TestCaseComponent_componentId_idx" ON "TestCaseComponent"("componentId");

-- CreateIndex
CREATE INDEX "Milestone_projectId_status_idx" ON "Milestone"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_projectId_name_key" ON "Milestone"("projectId", "name");

-- CreateIndex
CREATE INDEX "Environment_projectId_updatedAt_idx" ON "Environment"("projectId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Environment_projectId_name_key" ON "Environment"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationGroup_projectId_name_key" ON "ConfigurationGroup"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationGroup_projectId_position_key" ON "ConfigurationGroup"("projectId", "position");

-- CreateIndex
CREATE INDEX "ConfigurationOption_groupId_idx" ON "ConfigurationOption"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationOption_groupId_name_key" ON "ConfigurationOption"("groupId", "name");

-- CreateIndex
CREATE INDEX "RunConfiguration_runId_idx" ON "RunConfiguration"("runId");

-- CreateIndex
CREATE INDEX "RunConfiguration_optionId_idx" ON "RunConfiguration"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "RunConfiguration_runId_position_key" ON "RunConfiguration"("runId", "position");

-- CreateIndex
CREATE INDEX "ValidationFolder_projectId_parentId_idx" ON "ValidationFolder"("projectId", "parentId");

-- CreateIndex
CREATE INDEX "ValidationBrief_projectId_folderId_idx" ON "ValidationBrief"("projectId", "folderId");

-- CreateIndex
CREATE INDEX "ValidationBrief_projectId_status_idx" ON "ValidationBrief"("projectId", "status");

-- CreateIndex
CREATE INDEX "ValidationBrief_projectId_updatedAt_idx" ON "ValidationBrief"("projectId", "updatedAt");

-- CreateIndex
CREATE INDEX "ValidationCriterion_briefId_idx" ON "ValidationCriterion"("briefId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidationCriterion_briefId_position_key" ON "ValidationCriterion"("briefId", "position");

-- CreateIndex
CREATE INDEX "ValidationCheck_briefId_status_idx" ON "ValidationCheck"("briefId", "status");

-- CreateIndex
CREATE INDEX "ValidationCheck_testCaseId_idx" ON "ValidationCheck"("testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidationCheck_briefId_position_key" ON "ValidationCheck"("briefId", "position");

-- CreateIndex
CREATE INDEX "ValidationNote_briefId_createdAt_idx" ON "ValidationNote"("briefId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductionDemand_projectId_status_dueDate_idx" ON "ProductionDemand"("projectId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "ProductionDemand_projectId_type_criticality_idx" ON "ProductionDemand"("projectId", "type", "criticality");

-- CreateIndex
CREATE INDEX "ProductionDemand_projectId_qaOwner_idx" ON "ProductionDemand"("projectId", "qaOwner");

-- CreateIndex
CREATE INDEX "ProductionDemand_validationBriefId_idx" ON "ProductionDemand"("validationBriefId");

-- CreateIndex
CREATE INDEX "ProductionDemand_runId_idx" ON "ProductionDemand"("runId");

-- CreateIndex
CREATE INDEX "ProductionDemand_milestoneId_idx" ON "ProductionDemand"("milestoneId");

-- CreateIndex
CREATE INDEX "ProductionDemand_linkedAdId_idx" ON "ProductionDemand"("linkedAdId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionDemand_projectId_type_normalizedCode_key" ON "ProductionDemand"("projectId", "type", "normalizedCode");

-- CreateIndex
CREATE INDEX "ProductionDemandActivity_demandId_createdAt_id_idx" ON "ProductionDemandActivity"("demandId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ThirdParty_company_idx" ON "ThirdParty"("company");

-- CreateIndex
CREATE INDEX "ThirdParty_internalOwner_idx" ON "ThirdParty"("internalOwner");

-- CreateIndex
CREATE INDEX "ThirdParty_archivedAt_updatedAt_idx" ON "ThirdParty"("archivedAt", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdParty_normalizedName_normalizedCompany_key" ON "ThirdParty"("normalizedName", "normalizedCompany");

-- CreateIndex
CREATE INDEX "ThirdPartyAccessCycle_thirdPartyId_closedAt_expiresAt_idx" ON "ThirdPartyAccessCycle"("thirdPartyId", "closedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "ThirdPartyAccessCycle_expiresAt_idx" ON "ThirdPartyAccessCycle"("expiresAt");

-- CreateIndex
CREATE INDEX "ThirdPartyAccessGrant_system_idx" ON "ThirdPartyAccessGrant"("system");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyAccessGrant_cycleId_system_key" ON "ThirdPartyAccessGrant"("cycleId", "system");

-- CreateIndex
CREATE INDEX "ThirdPartyAccessActivity_thirdPartyId_createdAt_id_idx" ON "ThirdPartyAccessActivity"("thirdPartyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ThirdPartyAccessActivity_cycleId_idx" ON "ThirdPartyAccessActivity"("cycleId");

-- CreateIndex
CREATE INDEX "QuickNote_ownerId_createdDay_pinned_updatedAt_idx" ON "QuickNote"("ownerId", "createdDay", "pinned", "updatedAt");

-- CreateIndex
CREATE INDEX "QuickNote_ownerId_pinned_updatedAt_idx" ON "QuickNote"("ownerId", "pinned", "updatedAt");

-- CreateIndex
CREATE INDEX "NotificationAccessLeadDay_settingsId_days_idx" ON "NotificationAccessLeadDay"("settingsId", "days");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAccessLeadDay_settingsId_days_key" ON "NotificationAccessLeadDay"("settingsId", "days");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_dedupKey_key" ON "NotificationDelivery"("dedupKey");

-- CreateIndex
CREATE INDEX "NotificationDelivery_type_plannedDay_idx" ON "NotificationDelivery"("type", "plannedDay");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_createdAt_idx" ON "NotificationDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_originalDeliveryId_idx" ON "NotificationDelivery"("originalDeliveryId");

-- CreateIndex
CREATE INDEX "NotificationMessagePart_status_nextAttemptAt_idx" ON "NotificationMessagePart"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationMessagePart_deliveryId_position_key" ON "NotificationMessagePart"("deliveryId", "position");

-- CreateIndex
CREATE INDEX "NotificationAttempt_partId_startedAt_idx" ON "NotificationAttempt"("partId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAttempt_partId_attemptNumber_key" ON "NotificationAttempt"("partId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suite" ADD CONSTRAINT "Suite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suite" ADD CONSTRAINT "Suite_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Suite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "Suite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestStep" ADD CONSTRAINT "TestStep_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTestCase" ADD CONSTRAINT "RunTestCase_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTestCase" ADD CONSTRAINT "RunTestCase_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTestCase" ADD CONSTRAINT "RunTestCase_runPlanSectionId_fkey" FOREIGN KEY ("runPlanSectionId") REFERENCES "RunPlanSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTestCase" ADD CONSTRAINT "RunTestCase_dependsOnRunTestCaseId_fkey" FOREIGN KEY ("dependsOnRunTestCaseId") REFERENCES "RunTestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPlan" ADD CONSTRAINT "TestPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPlanItem" ADD CONSTRAINT "TestPlanItem_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPlanItem" ADD CONSTRAINT "TestPlanItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TestPlanSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPlanItem" ADD CONSTRAINT "TestPlanItem_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPlanItem" ADD CONSTRAINT "TestPlanItem_dependsOnItemId_fkey" FOREIGN KEY ("dependsOnItemId") REFERENCES "TestPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPlanSection" ADD CONSTRAINT "TestPlanSection_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunPlanSection" ADD CONSTRAINT "RunPlanSection_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestComponent" ADD CONSTRAINT "TestComponent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCaseComponent" ADD CONSTRAINT "TestCaseComponent_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCaseComponent" ADD CONSTRAINT "TestCaseComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "TestComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationGroup" ADD CONSTRAINT "ConfigurationGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationOption" ADD CONSTRAINT "ConfigurationOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ConfigurationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunConfiguration" ADD CONSTRAINT "RunConfiguration_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunConfiguration" ADD CONSTRAINT "RunConfiguration_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ConfigurationOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationFolder" ADD CONSTRAINT "ValidationFolder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationFolder" ADD CONSTRAINT "ValidationFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ValidationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationBrief" ADD CONSTRAINT "ValidationBrief_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationBrief" ADD CONSTRAINT "ValidationBrief_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ValidationFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationCriterion" ADD CONSTRAINT "ValidationCriterion_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "ValidationBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationCheck" ADD CONSTRAINT "ValidationCheck_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "ValidationBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationCheck" ADD CONSTRAINT "ValidationCheck_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationNote" ADD CONSTRAINT "ValidationNote_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "ValidationBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionDemand" ADD CONSTRAINT "ProductionDemand_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionDemand" ADD CONSTRAINT "ProductionDemand_validationBriefId_fkey" FOREIGN KEY ("validationBriefId") REFERENCES "ValidationBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionDemand" ADD CONSTRAINT "ProductionDemand_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionDemand" ADD CONSTRAINT "ProductionDemand_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionDemand" ADD CONSTRAINT "ProductionDemand_linkedAdId_fkey" FOREIGN KEY ("linkedAdId") REFERENCES "ProductionDemand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionDemandActivity" ADD CONSTRAINT "ProductionDemandActivity_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "ProductionDemand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyAccessCycle" ADD CONSTRAINT "ThirdPartyAccessCycle_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyAccessGrant" ADD CONSTRAINT "ThirdPartyAccessGrant_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ThirdPartyAccessCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyAccessActivity" ADD CONSTRAINT "ThirdPartyAccessActivity_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartyAccessActivity" ADD CONSTRAINT "ThirdPartyAccessActivity_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ThirdPartyAccessCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickNote" ADD CONSTRAINT "QuickNote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAccessLeadDay" ADD CONSTRAINT "NotificationAccessLeadDay_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "NotificationSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_originalDeliveryId_fkey" FOREIGN KEY ("originalDeliveryId") REFERENCES "NotificationDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationMessagePart" ADD CONSTRAINT "NotificationMessagePart_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "NotificationDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_partId_fkey" FOREIGN KEY ("partId") REFERENCES "NotificationMessagePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

