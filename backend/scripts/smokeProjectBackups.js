import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import {
  PROJECT_BACKUP_COLLECTIONS,
  PROJECT_BACKUP_EXCLUDED_MODELS,
  PROJECT_BACKUP_INCLUDED_MODELS,
  payloadChecksum
} from '../src/services/projectBackupContract.js';
import {
  buildProjectBackup,
  parseProjectBackup,
  projectBackupPreview,
  restoreProjectBackup
} from '../src/services/projectBackupService.js';

const prisma = new PrismaClient();
const fixed = new Date('2026-07-28T18:30:00.000Z');
const audit = { createdAt: fixed, updatedAt: fixed };

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function expectBackupError(action, expectedCode) {
  try {
    await action();
  } catch (error) {
    if (error.code === expectedCode) return;
    throw error;
  }
  throw new Error(`Expected backup error ${expectedCode}`);
}

function normalizePayload(payload) {
  const normalized = clone(payload);
  const referenceMap = new Map();

  for (const collectionName of PROJECT_BACKUP_COLLECTIONS) {
    normalized.collections[collectionName].forEach((item, index) => {
      referenceMap.set(item.ref, `${collectionName}:${index}`);
    });
  }

  function replaceReferences(value) {
    if (Array.isArray(value)) return value.map(replaceReferences);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, replaceReferences(item)])
      );
    }
    return typeof value === 'string' && referenceMap.has(value)
      ? referenceMap.get(value)
      : value;
  }

  const result = replaceReferences(normalized);
  result.project.name = '<restored-project>';
  return result;
}

async function verifyModelCoverage() {
  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
  const schemaModels = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map(
    (match) => match[1]
  );
  const declared = new Set([
    ...PROJECT_BACKUP_INCLUDED_MODELS,
    ...PROJECT_BACKUP_EXCLUDED_MODELS
  ]);
  const missing = schemaModels.filter((model) => !declared.has(model));
  const stale = [...declared].filter((model) => !schemaModels.includes(model));

  if (missing.length || stale.length) {
    throw new Error(
      `Backup model coverage mismatch. Missing: ${missing.join(', ')}; stale: ${stale.join(', ')}`
    );
  }
}

async function seedEmptyProject() {
  return prisma.project.create({
    data: {
      name: 'Backup vazio',
      description: 'Fixture deterministica sem dados vinculados',
      ...audit
    }
  });
}

async function seedRepresentativeProject() {
  const project = await prisma.project.create({
    data: { name: 'Backup representativo', description: 'Round trip', ...audit }
  });
  const parentSuite = await prisma.suite.create({
    data: {
      projectId: project.id,
      name: 'Fluxos principais',
      description: 'Raiz',
      ...audit
    }
  });
  const childSuite = await prisma.suite.create({
    data: {
      projectId: project.id,
      parentId: parentSuite.id,
      name: 'Reconexao',
      description: 'Filha',
      ...audit
    }
  });
  const component = await prisma.testComponent.create({
    data: {
      projectId: project.id,
      name: 'Video',
      normalizedName: 'video',
      description: 'Dispositivo',
      position: 0,
      ...audit
    }
  });
  const firstCase = await prisma.testCase.create({
    data: {
      suiteId: childSuite.id,
      title: 'Ativar alarme do dispositivo',
      preconditions: 'Dispositivo conectado',
      steps: 'Ativar alarme',
      expectedResult: 'Alarme ativo',
      priority: 'High',
      type: 'Integration',
      severity: 'High',
      automationStatus: 'Manual',
      ...audit
    }
  });
  const secondCase = await prisma.testCase.create({
    data: {
      suiteId: childSuite.id,
      title: 'Reconectar dispositivo de video',
      preconditions: 'Alarme ativo',
      steps: 'Desconectar e reconectar',
      expectedResult: 'Video restabelecido',
      priority: 'Critical',
      type: 'EndToEnd',
      severity: 'Critical',
      automationStatus: 'ToAutomate',
      ...audit
    }
  });
  await prisma.testStep.createMany({
    data: [
      {
        testCaseId: firstCase.id,
        position: 0,
        action: 'Ativar o alarme',
        expectedResult: 'Indicador ativo',
        ...audit
      },
      {
        testCaseId: secondCase.id,
        position: 0,
        action: 'Reconectar o dispositivo',
        expectedResult: 'Stream retomado',
        ...audit
      }
    ]
  });
  await prisma.testCaseComponent.createMany({
    data: [
      { testCaseId: firstCase.id, componentId: component.id, createdAt: fixed },
      { testCaseId: secondCase.id, componentId: component.id, createdAt: fixed }
    ]
  });

  const milestone = await prisma.milestone.create({
    data: {
      projectId: project.id,
      name: 'Versao 1.0',
      description: 'Entrega',
      status: 'Active',
      startDate: fixed,
      dueDate: new Date('2026-08-20T18:30:00.000Z'),
      completedAt: null,
      ...audit
    }
  });
  const environment = await prisma.environment.create({
    data: {
      projectId: project.id,
      name: 'Homologacao',
      description: 'Ambiente QA',
      target: 'Windows',
      ...audit
    }
  });
  const group = await prisma.configurationGroup.create({
    data: { projectId: project.id, name: 'Banco', position: 0, ...audit }
  });
  const option = await prisma.configurationOption.create({
    data: { groupId: group.id, name: 'SQLite', ...audit }
  });

  const plan = await prisma.testPlan.create({
    data: {
      projectId: project.id,
      name: 'Alarme e reconexao',
      description: 'Cenario composto',
      ...audit
    }
  });
  const planSection = await prisma.testPlanSection.create({
    data: {
      testPlanId: plan.id,
      name: 'Fluxo',
      description: 'Ordem operacional',
      position: 0,
      ...audit
    }
  });
  const firstItem = await prisma.testPlanItem.create({
    data: {
      testPlanId: plan.id,
      sectionId: planSection.id,
      testCaseId: firstCase.id,
      position: 0,
      transitionInstructions: null,
      ...audit
    }
  });
  await prisma.testPlanItem.create({
    data: {
      testPlanId: plan.id,
      sectionId: planSection.id,
      testCaseId: secondCase.id,
      position: 1,
      transitionInstructions: 'Manter alarme ativo',
      dependsOnItemId: firstItem.id,
      ...audit
    }
  });

  const rootFolder = await prisma.validationFolder.create({
    data: { projectId: project.id, name: 'Features', ...audit }
  });
  const childFolder = await prisma.validationFolder.create({
    data: {
      projectId: project.id,
      parentId: rootFolder.id,
      name: 'Video',
      ...audit
    }
  });
  const brief = await prisma.validationBrief.create({
    data: {
      projectId: project.id,
      folderId: childFolder.id,
      title: 'Validar reconexao',
      sourceUrl: 'https://jira.local/CARD-1',
      objective: 'Garantir continuidade',
      scope: 'Alarme e video',
      generalNotes: 'Executar em homologacao',
      status: 'Completed',
      completedAt: fixed,
      ...audit
    }
  });
  await prisma.validationCriterion.create({
    data: {
      briefId: brief.id,
      position: 0,
      text: 'Sem perda de evento',
      isMet: true,
      ...audit
    }
  });
  await prisma.validationCheck.create({
    data: {
      briefId: brief.id,
      testCaseId: secondCase.id,
      position: 0,
      title: 'Reconexao',
      expectedResult: 'Stream retorna',
      actualResult: 'Stream retornou',
      notes: 'Sem perda',
      status: 'Passed',
      executedAt: fixed,
      ...audit
    }
  });
  await prisma.validationNote.create({
    data: {
      briefId: brief.id,
      kind: 'Note',
      content: 'Evidencia validada',
      ...audit
    }
  });

  const run = await prisma.run.create({
    data: {
      projectId: project.id,
      testPlanId: plan.id,
      milestoneId: milestone.id,
      environmentId: environment.id,
      name: 'Execucao composta',
      status: 'Completed',
      snapshotPlanName: plan.name,
      snapshotMilestoneName: milestone.name,
      snapshotEnvironmentName: environment.name,
      snapshotEnvironmentTarget: environment.target,
      completedAt: fixed,
      ...audit
    }
  });
  const runSection = await prisma.runPlanSection.create({
    data: {
      runId: run.id,
      name: planSection.name,
      description: planSection.description,
      position: 0,
      ...audit
    }
  });
  const firstRunCase = await prisma.runTestCase.create({
    data: {
      runId: run.id,
      testCaseId: firstCase.id,
      runPlanSectionId: runSection.id,
      position: 0,
      status: 'Passed',
      actualResult: 'Alarme ativo',
      evidence: 'evidencia://alarme',
      executor: 'Vitor',
      durationSeconds: 45,
      snapshotTitle: firstCase.title,
      snapshotPreconditions: firstCase.preconditions,
      snapshotSteps: firstCase.steps,
      snapshotExpectedResult: firstCase.expectedResult,
      snapshotPriority: firstCase.priority,
      snapshotType: firstCase.type,
      snapshotSeverity: firstCase.severity,
      snapshotAutomationStatus: firstCase.automationStatus,
      executedAt: fixed,
      ...audit
    }
  });
  await prisma.runTestCase.create({
    data: {
      runId: run.id,
      testCaseId: secondCase.id,
      runPlanSectionId: runSection.id,
      position: 1,
      transitionInstructions: 'Manter estado',
      dependsOnRunTestCaseId: firstRunCase.id,
      status: 'Failed',
      comment: 'Falha intermitente',
      actualResult: 'Retorno tardio',
      evidence: 'evidencia://reconexao',
      defectLink: 'https://jira.local/BUG-1',
      executor: 'Vitor',
      durationSeconds: 90,
      snapshotTitle: secondCase.title,
      snapshotPreconditions: secondCase.preconditions,
      snapshotSteps: secondCase.steps,
      snapshotExpectedResult: secondCase.expectedResult,
      snapshotPriority: secondCase.priority,
      snapshotType: secondCase.type,
      snapshotSeverity: secondCase.severity,
      snapshotAutomationStatus: secondCase.automationStatus,
      executedAt: fixed,
      ...audit
    }
  });
  await prisma.runConfiguration.create({
    data: {
      runId: run.id,
      optionId: option.id,
      position: 0,
      snapshotGroupName: group.name,
      snapshotOptionName: option.name,
      ...audit
    }
  });

  const ad = await prisma.productionDemand.create({
    data: {
      projectId: project.id,
      type: 'AD',
      code: 'AD-001',
      normalizedCode: 'ad-001',
      sourceUrl: 'https://jira.local/AD-001',
      title: 'Falha de reconexao',
      description: 'Afeta producao',
      supportContact: 'Fulano',
      qaOwner: 'Vitor',
      status: 'Open',
      registeredAt: fixed,
      dueDate: null,
      criticality: 'High',
      affectedUsersCount: 12,
      validationBriefId: brief.id,
      runId: run.id,
      milestoneId: milestone.id,
      ...audit
    }
  });
  const mf = await prisma.productionDemand.create({
    data: {
      projectId: project.id,
      type: 'MF',
      code: 'MF-001',
      normalizedCode: 'mf-001',
      title: 'Video nao retorna',
      supportContact: 'Fulano',
      qaOwner: 'Vitor',
      status: 'Closed',
      registeredAt: fixed,
      dueDate: new Date('2026-08-17T18:30:00.000Z'),
      workaroundSummary: 'Reiniciar servico',
      workaroundDeliveredAt: fixed,
      closureReason: 'Paliativa entregue',
      closedAt: fixed,
      linkedAdId: ad.id,
      ...audit
    }
  });
  await prisma.productionDemandActivity.createMany({
    data: [
      {
        demandId: ad.id,
        kind: 'Created',
        message: 'AD registrada',
        author: 'Vitor',
        createdAt: fixed
      },
      {
        demandId: mf.id,
        kind: 'Closed',
        message: 'Paliativa entregue',
        author: 'Vitor',
        previousState: 'Open',
        nextState: 'Closed',
        createdAt: fixed
      }
    ]
  });

  return project;
}

async function run() {
  await verifyModelCoverage();
  const emptySource = await seedEmptyProject();
  const source = await seedRepresentativeProject();
  const cleanupIds = [emptySource.id, source.id];

  try {
    const emptyBackup = await buildProjectBackup(prisma, emptySource.id, fixed);
    const repeatedEmptyBackup = await buildProjectBackup(prisma, emptySource.id, fixed);
    parseProjectBackup(emptyBackup.document);
    if (
      JSON.stringify(emptyBackup.document) !==
      JSON.stringify(repeatedEmptyBackup.document)
    ) {
      throw new Error('Empty fixture backup is not deterministic');
    }
    if (
      PROJECT_BACKUP_COLLECTIONS.some(
        (collectionName) =>
          emptyBackup.document.payload.collections[collectionName].length !== 0
      )
    ) {
      throw new Error('Empty fixture unexpectedly contains project records');
    }

    await expectBackupError(
      () => buildProjectBackup(prisma, 2_147_483_647, fixed),
      'PROJECT_NOT_FOUND'
    );

    const beforePreview = await prisma.project.count();
    const backup = await buildProjectBackup(prisma, source.id, fixed);
    const parsed = parseProjectBackup(backup.document);
    const preview = projectBackupPreview(parsed, {
      sizeBytes: Buffer.byteLength(JSON.stringify(backup.document)),
      suggestedName: 'Backup representativo - restaurado'
    });
    if (
      preview.sourceProjectName !== source.name ||
      preview.counts.testCases !== 2 ||
      preview.counts.runs !== 1
    ) {
      throw new Error('Backup preview does not match the representative fixture');
    }
    if (await prisma.project.count() !== beforePreview) {
      throw new Error('Backup validation changed the database');
    }

    const corrupted = clone(backup.document);
    corrupted.payload.project.description = 'alterado';
    await expectBackupError(() => parseProjectBackup(corrupted), 'INTEGRITY_FAILURE');

    const newer = clone(backup.document);
    newer.version = 2;
    await expectBackupError(() => parseProjectBackup(newer), 'UNSUPPORTED_VERSION');

    const brokenReference = clone(backup.document);
    brokenReference.payload.collections.testCases[0].suiteRef = 'suite:missing';
    brokenReference.integrity.payloadHash = payloadChecksum(brokenReference.payload);
    await expectBackupError(
      () => parseProjectBackup(brokenReference),
      'INVALID_STRUCTURE'
    );

    const beforeRollback = await prisma.project.count();
    try {
      await restoreProjectBackup(prisma, backup.document, 'Rollback esperado', {
        failAfterCollection: 'testCases'
      });
      throw new Error('Injected restore failure did not fail');
    } catch (error) {
      if (!String(error.message).includes('simulada')) throw error;
    }
    if (await prisma.project.count() !== beforeRollback) {
      throw new Error('Failed restore left a project behind');
    }

    const restored = await restoreProjectBackup(
      prisma,
      backup.document,
      'Backup representativo - restaurado'
    );
    cleanupIds.push(restored.project.id);
    const restoredAgain = await restoreProjectBackup(
      prisma,
      backup.document,
      'Backup representativo - restaurado (2)'
    );
    cleanupIds.push(restoredAgain.project.id);

    const roundTrip = await buildProjectBackup(prisma, restored.project.id, fixed);
    const left = JSON.stringify(normalizePayload(backup.document.payload));
    const right = JSON.stringify(normalizePayload(roundTrip.document.payload));
    if (left !== right) {
      throw new Error('Export-import-export payloads are not equivalent');
    }

    if (
      restored.project.id === source.id ||
      restoredAgain.project.id === restored.project.id
    ) {
      throw new Error('Repeated imports reused local project ids');
    }

    console.log('Project backup smoke test passed.');
  } finally {
    for (const id of cleanupIds.reverse()) {
      await prisma.project.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
