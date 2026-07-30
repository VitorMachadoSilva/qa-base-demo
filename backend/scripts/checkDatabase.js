import { prisma } from '../src/db/client.js';

async function checkDatabase() {
  const [
    users,
    sessions,
    projects,
    suites,
    testCases,
    testSteps,
    runs,
    runTestCases,
    testPlans,
    testPlanItems,
    milestones,
    environments,
    configurationGroups,
    configurationOptions,
    runConfigurations,
    validationFolders,
    validationBriefs,
    validationCriteria,
    validationChecks,
    validationNotes,
    testComponents,
    testCaseComponents,
    testPlanSections,
    runPlanSections,
    productionDemands,
    productionDemandActivities,
    thirdParties,
    thirdPartyAccessCycles,
    thirdPartyAccessGrants,
    thirdPartyAccessActivities,
    quickNotes,
    notificationSettings,
    notificationAccessLeadDays,
    notificationDeliveries,
    notificationMessageParts,
    notificationAttempts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.session.count(),
    prisma.project.count(),
    prisma.suite.count(),
    prisma.testCase.count(),
    prisma.testStep.count(),
    prisma.run.count(),
    prisma.runTestCase.count(),
    prisma.testPlan.count(),
    prisma.testPlanItem.count(),
    prisma.milestone.count(),
    prisma.environment.count(),
    prisma.configurationGroup.count(),
    prisma.configurationOption.count(),
    prisma.runConfiguration.count(),
    prisma.validationFolder.count(),
    prisma.validationBrief.count(),
    prisma.validationCriterion.count(),
    prisma.validationCheck.count(),
    prisma.validationNote.count(),
    prisma.testComponent.count(),
    prisma.testCaseComponent.count(),
    prisma.testPlanSection.count(),
    prisma.runPlanSection.count(),
    prisma.productionDemand.count(),
    prisma.productionDemandActivity.count(),
    prisma.thirdParty.count(),
    prisma.thirdPartyAccessCycle.count(),
    prisma.thirdPartyAccessGrant.count(),
    prisma.thirdPartyAccessActivity.count(),
    prisma.quickNote.count(),
    prisma.notificationSettings.count(),
    prisma.notificationAccessLeadDay.count(),
    prisma.notificationDelivery.count(),
    prisma.notificationMessagePart.count(),
    prisma.notificationAttempt.count()
  ]);

  const orphanedSuites = await prisma.suite.count({
    where: {
      parentId: { not: null },
      parent: null
    }
  });

  const casesWithoutSteps = await prisma.testCase.count({
    where: {
      testSteps: { none: {} }
    }
  });

  const integrityCounts = await Promise.all([
    countRows(`SELECT COUNT(*) AS "count"
      FROM "Session" session
      LEFT JOIN "User" user ON user."id" = session."userId"
      WHERE user."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "QuickNote" note
      LEFT JOIN "User" user ON user."id" = note."ownerId"
      WHERE user."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "User"
      WHERE "email" NOT IN (
        'waldyr.rodrigues@qabase.com',
        'walissom.correa@qabase.com',
        'vitor.silva@qabase.com'
      )`),
    countRows(`SELECT CASE WHEN COUNT(*) = 3 THEN 0 ELSE 1 END AS "count"
      FROM "User"
      WHERE "email" IN (
        'waldyr.rodrigues@qabase.com',
        'walissom.correa@qabase.com',
        'vitor.silva@qabase.com'
      )`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "testPlanId", "position"
      FROM "TestPlanSection"
      GROUP BY "testPlanId", "position"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "projectId", "position"
      FROM "ConfigurationGroup"
      GROUP BY "projectId", "position"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "TestPlanItem" item
      JOIN "TestPlan" plan ON plan."id" = item."testPlanId"
      JOIN "TestCase" test_case ON test_case."id" = item."testCaseId"
      JOIN "Suite" suite ON suite."id" = test_case."suiteId"
      WHERE plan."projectId" <> suite."projectId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "Run" run
      LEFT JOIN "TestPlan" plan ON plan."id" = run."testPlanId"
      LEFT JOIN "Milestone" milestone ON milestone."id" = run."milestoneId"
      LEFT JOIN "Environment" environment ON environment."id" = run."environmentId"
      WHERE (plan."id" IS NOT NULL AND plan."projectId" <> run."projectId")
        OR (milestone."id" IS NOT NULL AND milestone."projectId" <> run."projectId")
        OR (environment."id" IS NOT NULL AND environment."projectId" <> run."projectId")`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "RunConfiguration" selection
      JOIN "Run" run ON run."id" = selection."runId"
      JOIN "ConfigurationOption" option ON option."id" = selection."optionId"
      JOIN "ConfigurationGroup" config_group ON config_group."id" = option."groupId"
      WHERE config_group."projectId" <> run."projectId"`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT selection."runId", option."groupId"
      FROM "RunConfiguration" selection
      JOIN "ConfigurationOption" option ON option."id" = selection."optionId"
      GROUP BY selection."runId", option."groupId"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "briefId", "position"
      FROM "ValidationCriterion"
      GROUP BY "briefId", "position"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "briefId", "position"
      FROM "ValidationCheck"
      GROUP BY "briefId", "position"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ValidationFolder" child
      JOIN "ValidationFolder" parent ON parent."id" = child."parentId"
      WHERE child."projectId" <> parent."projectId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ValidationBrief" brief
      JOIN "ValidationFolder" folder ON folder."id" = brief."folderId"
      WHERE brief."projectId" <> folder."projectId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ValidationCheck" check_item
      JOIN "ValidationBrief" brief ON brief."id" = check_item."briefId"
      JOIN "TestCase" test_case ON test_case."id" = check_item."testCaseId"
      JOIN "Suite" suite ON suite."id" = test_case."suiteId"
      WHERE brief."projectId" <> suite."projectId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "TestPlan" plan
      WHERE NOT EXISTS (
        SELECT 1 FROM "TestPlanSection" section
        WHERE section."testPlanId" = plan."id"
      )`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "sectionId", "position"
      FROM "TestPlanItem"
      GROUP BY "sectionId", "position"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "TestPlanItem" item
      JOIN "TestPlanSection" section ON section."id" = item."sectionId"
      WHERE item."testPlanId" <> section."testPlanId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "TestPlanItem" item
      JOIN "TestPlanItem" dependency ON dependency."id" = item."dependsOnItemId"
      WHERE item."testPlanId" <> dependency."testPlanId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "TestCaseComponent" association
      JOIN "TestCase" test_case ON test_case."id" = association."testCaseId"
      JOIN "Suite" suite ON suite."id" = test_case."suiteId"
      JOIN "TestComponent" component ON component."id" = association."componentId"
      WHERE suite."projectId" <> component."projectId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "RunTestCase" item
      JOIN "RunPlanSection" section ON section."id" = item."runPlanSectionId"
      WHERE item."runId" <> section."runId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "RunTestCase" item
      JOIN "RunTestCase" dependency
        ON dependency."id" = item."dependsOnRunTestCaseId"
      WHERE item."runId" <> dependency."runId"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ProductionDemand" demand
      LEFT JOIN "Project" project ON project."id" = demand."projectId"
      WHERE project."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ProductionDemand" demand
      LEFT JOIN "ValidationBrief" brief
        ON brief."id" = demand."validationBriefId"
      LEFT JOIN "Run" run ON run."id" = demand."runId"
      LEFT JOIN "Milestone" milestone
        ON milestone."id" = demand."milestoneId"
      LEFT JOIN "ProductionDemand" linked_ad
        ON linked_ad."id" = demand."linkedAdId"
      WHERE (brief."id" IS NOT NULL AND brief."projectId" <> demand."projectId")
        OR (run."id" IS NOT NULL AND run."projectId" <> demand."projectId")
        OR (milestone."id" IS NOT NULL AND milestone."projectId" <> demand."projectId")
        OR (linked_ad."id" IS NOT NULL AND linked_ad."projectId" <> demand."projectId")`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ProductionDemand" demand
      JOIN "ProductionDemand" linked_ad
        ON linked_ad."id" = demand."linkedAdId"
      WHERE demand."type" <> 'MF'
        OR linked_ad."type" <> 'AD'
        OR demand."id" = linked_ad."id"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ProductionDemandActivity" activity
      LEFT JOIN "ProductionDemand" demand
        ON demand."id" = activity."demandId"
      WHERE demand."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ThirdPartyAccessCycle" cycle
      LEFT JOIN "ThirdParty" third_party
        ON third_party."id" = cycle."thirdPartyId"
      WHERE third_party."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ThirdPartyAccessGrant" grant_item
      LEFT JOIN "ThirdPartyAccessCycle" cycle
        ON cycle."id" = grant_item."cycleId"
      WHERE cycle."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ThirdPartyAccessActivity" activity
      LEFT JOIN "ThirdParty" third_party
        ON third_party."id" = activity."thirdPartyId"
      WHERE third_party."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "cycleId", "system"
      FROM "ThirdPartyAccessGrant"
      GROUP BY "cycleId", "system"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "thirdPartyId"
      FROM "ThirdPartyAccessCycle"
      WHERE "closedAt" IS NULL
      GROUP BY "thirdPartyId"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "ThirdPartyAccessGrant"
      WHERE "system" NOT IN ('Teams', 'GitLab', 'VPN', 'Jira', 'Confluence')`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "QuickNote"
      WHERE "color" NOT IN ('Paper', 'Lemon', 'Mint', 'Sky', 'Lilac', 'Rose', 'Coral')`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "QuickNote"
      WHERE "createdDay" NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "NotificationSettings"
      WHERE "id" <> 1`),
    countRows(`SELECT CASE WHEN COUNT(*) = 1 THEN 0 ELSE 1 END AS "count"
      FROM "NotificationSettings"`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "NotificationAccessLeadDay"
      WHERE "days" <= 0`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "settingsId", "days"
      FROM "NotificationAccessLeadDay"
      GROUP BY "settingsId", "days"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "NotificationMessagePart" part
      LEFT JOIN "NotificationDelivery" delivery
        ON delivery."id" = part."deliveryId"
      WHERE delivery."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "NotificationAttempt" attempt
      LEFT JOIN "NotificationMessagePart" part
        ON part."id" = attempt."partId"
      WHERE part."id" IS NULL`),
    countRows(`SELECT COUNT(*) AS "count" FROM (
      SELECT "dedupKey"
      FROM "NotificationDelivery"
      GROUP BY "dedupKey"
      HAVING COUNT(*) > 1
    )`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "NotificationMessagePart"
      WHERE "position" <= 0`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "NotificationAttempt"
      WHERE "attemptNumber" <= 0`),
    countRows(`SELECT COUNT(*) AS "count"
      FROM "NotificationDelivery" delivery
      WHERE (delivery."status" = 'NoData' AND EXISTS (
        SELECT 1 FROM "NotificationMessagePart" part
        WHERE part."deliveryId" = delivery."id"
      ))
      OR (delivery."status" = 'Sent' AND EXISTS (
        SELECT 1 FROM "NotificationMessagePart" part
        WHERE part."deliveryId" = delivery."id"
          AND part."status" <> 'Sent'
      ))`)
  ]);

  const [
    orphanedSessions,
    orphanedQuickNotes,
    unexpectedUsers,
    invalidFixedUserCardinality,
    duplicatePlanSectionPositions,
    duplicateConfigurationGroupPositions,
    crossProjectPlanItems,
    crossProjectRunContexts,
    crossProjectRunConfigurations,
    duplicateRunConfigurationGroups,
    duplicateValidationCriterionPositions,
    duplicateValidationCheckPositions,
    crossProjectValidationFolderParents,
    crossProjectValidationBriefFolders,
    crossProjectValidationPromotions,
    plansWithoutSections,
    duplicatePlanItemPositions,
    crossPlanSections,
    crossPlanDependencies,
    crossProjectCaseComponents,
    crossRunSections,
    crossRunDependencies,
    orphanedProductionDemands,
    crossProjectProductionDemandLinks,
    invalidProductionDemandAdLinks,
    orphanedProductionDemandActivities,
    orphanedThirdPartyAccessCycles,
    orphanedThirdPartyAccessGrants,
    orphanedThirdPartyAccessActivities,
    duplicateThirdPartyAccessGrants,
    multipleCurrentThirdPartyAccessCycles,
    invalidThirdPartyAccessSystems,
    invalidQuickNoteColors,
    invalidQuickNoteCreatedDays,
    unexpectedNotificationSettingsIds,
    invalidNotificationSettingsCardinality,
    invalidNotificationLeadDays,
    duplicateNotificationLeadDays,
    orphanedNotificationParts,
    orphanedNotificationAttempts,
    duplicateNotificationDedupKeys,
    invalidNotificationPartPositions,
    invalidNotificationAttemptNumbers,
    inconsistentNotificationDeliveryStates
  ] = integrityCounts;

  console.log(
    JSON.stringify(
      {
        users,
        sessions,
        projects,
        suites,
        testCases,
        testSteps,
        runs,
        runTestCases,
        testPlans,
        testPlanItems,
        milestones,
        environments,
        configurationGroups,
        configurationOptions,
        runConfigurations,
        validationFolders,
        validationBriefs,
        validationCriteria,
        validationChecks,
        validationNotes,
        testComponents,
        testCaseComponents,
        testPlanSections,
        runPlanSections,
        productionDemands,
        productionDemandActivities,
        thirdParties,
        thirdPartyAccessCycles,
        thirdPartyAccessGrants,
        thirdPartyAccessActivities,
        quickNotes,
        notificationSettings,
        notificationAccessLeadDays,
        notificationDeliveries,
        notificationMessageParts,
        notificationAttempts,
        orphanedSessions,
        orphanedQuickNotes,
        unexpectedUsers,
        invalidFixedUserCardinality,
        orphanedSuites,
        casesWithoutSteps,
        duplicatePlanSectionPositions,
        duplicateConfigurationGroupPositions,
        crossProjectPlanItems,
        crossProjectRunContexts,
        crossProjectRunConfigurations,
        duplicateRunConfigurationGroups,
        duplicateValidationCriterionPositions,
        duplicateValidationCheckPositions,
        crossProjectValidationFolderParents,
        crossProjectValidationBriefFolders,
        crossProjectValidationPromotions,
        plansWithoutSections,
        duplicatePlanItemPositions,
        crossPlanSections,
        crossPlanDependencies,
        crossProjectCaseComponents,
        crossRunSections,
        crossRunDependencies,
        orphanedProductionDemands,
        crossProjectProductionDemandLinks,
        invalidProductionDemandAdLinks,
        orphanedProductionDemandActivities,
        orphanedThirdPartyAccessCycles,
        orphanedThirdPartyAccessGrants,
        orphanedThirdPartyAccessActivities,
        duplicateThirdPartyAccessGrants,
        multipleCurrentThirdPartyAccessCycles,
        invalidThirdPartyAccessSystems,
        invalidQuickNoteColors,
        invalidQuickNoteCreatedDays,
        unexpectedNotificationSettingsIds,
        invalidNotificationSettingsCardinality,
        invalidNotificationLeadDays,
        duplicateNotificationLeadDays,
        orphanedNotificationParts,
        orphanedNotificationAttempts,
        duplicateNotificationDedupKeys,
        invalidNotificationPartPositions,
        invalidNotificationAttemptNumbers,
        inconsistentNotificationDeliveryStates
      },
      null,
      2
    )
  );
}

async function countRows(sql) {
  const rows = await prisma.$queryRawUnsafe(sql);
  return Number(rows[0]?.count || 0);
}

checkDatabase()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
