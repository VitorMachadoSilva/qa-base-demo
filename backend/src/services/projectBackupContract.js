import { createHash } from 'node:crypto';
import { z } from 'zod';

export const PROJECT_BACKUP_FORMAT = 'qabase.project-backup';
export const PROJECT_BACKUP_VERSION = 1;
export const PROJECT_BACKUP_MIME = 'application/vnd.qabase.project-backup+json';
export const PROJECT_BACKUP_LIMIT_BYTES = 50 * 1024 * 1024;

export const PROJECT_BACKUP_COLLECTIONS = Object.freeze([
  'suites',
  'testCases',
  'testSteps',
  'testComponents',
  'testCaseComponents',
  'testPlans',
  'testPlanSections',
  'testPlanItems',
  'milestones',
  'environments',
  'configurationGroups',
  'configurationOptions',
  'validationFolders',
  'validationBriefs',
  'validationCriteria',
  'validationChecks',
  'validationNotes',
  'runs',
  'runPlanSections',
  'runTestCases',
  'runConfigurations',
  'productionDemands',
  'productionDemandActivities'
]);

export const PROJECT_BACKUP_EXCLUDED_MODELS = Object.freeze([
  'User',
  'Session',
  'QuickNote',
  'ThirdParty',
  'ThirdPartyAccessCycle',
  'ThirdPartyAccessGrant',
  'ThirdPartyAccessActivity',
  'NotificationSettings',
  'NotificationAccessLeadDay',
  'NotificationDelivery',
  'NotificationMessagePart',
  'NotificationAttempt'
]);

export const PROJECT_BACKUP_INCLUDED_MODELS = Object.freeze([
  'Project',
  'Suite',
  'TestCase',
  'TestStep',
  'Run',
  'RunTestCase',
  'TestPlan',
  'TestPlanItem',
  'TestPlanSection',
  'RunPlanSection',
  'TestComponent',
  'TestCaseComponent',
  'Milestone',
  'Environment',
  'ConfigurationGroup',
  'ConfigurationOption',
  'RunConfiguration',
  'ValidationFolder',
  'ValidationBrief',
  'ValidationCriterion',
  'ValidationCheck',
  'ValidationNote',
  'ProductionDemand',
  'ProductionDemandActivity'
]);

const text = z.string();
const nullableText = z.string().nullable();
const integer = z.number().int();
const nullableInteger = z.number().int().nullable();
const timestamp = z.string().datetime({ offset: true });
const nullableTimestamp = timestamp.nullable();
const reference = z.string().regex(/^[a-z][a-zA-Z]+:[^\s]+$/);
const nullableReference = reference.nullable();

const audited = {
  createdAt: timestamp,
  updatedAt: timestamp
};

function entity(prefix, shape) {
  return z
    .object({
      ref: z.string().startsWith(`${prefix}:`),
      ...shape
    })
    .strict();
}

const projectSchema = z
  .object({
    name: text,
    description: nullableText,
    ...audited
  })
  .strict();

const collectionSchemas = {
  suites: entity('suite', {
    parentRef: nullableReference,
    name: text,
    description: nullableText,
    ...audited
  }),
  testCases: entity('case', {
    suiteRef: reference,
    title: text,
    preconditions: nullableText,
    steps: text,
    expectedResult: text,
    priority: text,
    type: text,
    severity: text,
    automationStatus: text,
    ...audited
  }),
  testSteps: entity('step', {
    testCaseRef: reference,
    position: integer,
    action: text,
    expectedResult: text,
    ...audited
  }),
  testComponents: entity('component', {
    name: text,
    normalizedName: text,
    description: nullableText,
    position: integer,
    ...audited
  }),
  testCaseComponents: entity('caseComponent', {
    testCaseRef: reference,
    componentRef: reference,
    createdAt: timestamp
  }),
  testPlans: entity('plan', {
    name: text,
    description: nullableText,
    ...audited
  }),
  testPlanSections: entity('planSection', {
    testPlanRef: reference,
    name: text,
    description: nullableText,
    position: integer,
    ...audited
  }),
  testPlanItems: entity('planItem', {
    testPlanRef: reference,
    sectionRef: reference,
    testCaseRef: reference,
    position: integer,
    transitionInstructions: nullableText,
    dependsOnItemRef: nullableReference,
    ...audited
  }),
  milestones: entity('milestone', {
    name: text,
    description: nullableText,
    status: text,
    startDate: nullableTimestamp,
    dueDate: nullableTimestamp,
    completedAt: nullableTimestamp,
    ...audited
  }),
  environments: entity('environment', {
    name: text,
    description: nullableText,
    target: nullableText,
    ...audited
  }),
  configurationGroups: entity('configurationGroup', {
    name: text,
    position: integer,
    ...audited
  }),
  configurationOptions: entity('configurationOption', {
    groupRef: reference,
    name: text,
    ...audited
  }),
  validationFolders: entity('validationFolder', {
    parentRef: nullableReference,
    name: text,
    ...audited
  }),
  validationBriefs: entity('validationBrief', {
    folderRef: nullableReference,
    title: text,
    sourceUrl: nullableText,
    objective: nullableText,
    scope: nullableText,
    generalNotes: nullableText,
    status: text,
    completedAt: nullableTimestamp,
    ...audited
  }),
  validationCriteria: entity('validationCriterion', {
    briefRef: reference,
    position: integer,
    text,
    isMet: z.boolean(),
    ...audited
  }),
  validationChecks: entity('validationCheck', {
    briefRef: reference,
    testCaseRef: nullableReference,
    position: integer,
    title: text,
    expectedResult: text,
    actualResult: nullableText,
    notes: nullableText,
    status: text,
    executedAt: nullableTimestamp,
    ...audited
  }),
  validationNotes: entity('validationNote', {
    briefRef: reference,
    kind: text,
    content: text,
    ...audited
  }),
  runs: entity('run', {
    testPlanRef: nullableReference,
    milestoneRef: nullableReference,
    environmentRef: nullableReference,
    name: text,
    status: text,
    snapshotPlanName: nullableText,
    snapshotMilestoneName: nullableText,
    snapshotEnvironmentName: nullableText,
    snapshotEnvironmentTarget: nullableText,
    completedAt: nullableTimestamp,
    ...audited
  }),
  runPlanSections: entity('runPlanSection', {
    runRef: reference,
    name: text,
    description: nullableText,
    position: integer,
    ...audited
  }),
  runTestCases: entity('runCase', {
    runRef: reference,
    testCaseRef: nullableReference,
    runPlanSectionRef: nullableReference,
    position: integer,
    transitionInstructions: nullableText,
    dependsOnRunCaseRef: nullableReference,
    status: text,
    comment: nullableText,
    actualResult: nullableText,
    evidence: nullableText,
    defectLink: nullableText,
    executor: nullableText,
    durationSeconds: nullableInteger,
    snapshotTitle: nullableText,
    snapshotPreconditions: nullableText,
    snapshotSteps: nullableText,
    snapshotExpectedResult: nullableText,
    snapshotPriority: nullableText,
    snapshotType: nullableText,
    snapshotSeverity: nullableText,
    snapshotAutomationStatus: nullableText,
    executedAt: nullableTimestamp,
    ...audited
  }),
  runConfigurations: entity('runConfiguration', {
    runRef: reference,
    optionRef: nullableReference,
    position: integer,
    snapshotGroupName: text,
    snapshotOptionName: text,
    ...audited
  }),
  productionDemands: entity('demand', {
    type: text,
    code: text,
    normalizedCode: text,
    sourceUrl: nullableText,
    title: text,
    description: nullableText,
    supportContact: text,
    qaOwner: text,
    status: text,
    registeredAt: timestamp,
    dueDate: nullableTimestamp,
    criticality: nullableText,
    affectedUsersCount: nullableInteger,
    workaroundSummary: nullableText,
    workaroundDeliveredAt: nullableTimestamp,
    resolutionSummary: nullableText,
    productionVersion: nullableText,
    productionReleasedAt: nullableTimestamp,
    closureReason: nullableText,
    closedAt: nullableTimestamp,
    validationBriefRef: nullableReference,
    runRef: nullableReference,
    milestoneRef: nullableReference,
    linkedAdRef: nullableReference,
    ...audited
  }),
  productionDemandActivities: entity('demandActivity', {
    demandRef: reference,
    kind: text,
    message: text,
    author: nullableText,
    previousState: nullableText,
    nextState: nullableText,
    createdAt: timestamp
  })
};

const collectionsShape = Object.fromEntries(
  PROJECT_BACKUP_COLLECTIONS.map((name) => [name, z.array(collectionSchemas[name])])
);
const countsShape = Object.fromEntries(
  PROJECT_BACKUP_COLLECTIONS.map((name) => [name, z.number().int().nonnegative()])
);

export const projectBackupPayloadSchema = z
  .object({
    project: projectSchema,
    collections: z.object(collectionsShape).strict()
  })
  .strict();

export const projectBackupDocumentSchema = z
  .object({
    format: z.literal(PROJECT_BACKUP_FORMAT),
    version: z.literal(PROJECT_BACKUP_VERSION),
    manifest: z
      .object({
        application: z.literal('QaBase'),
        exportedAt: timestamp,
        sourceProjectName: text,
        counts: z.object(countsShape).strict()
      })
      .strict(),
    payload: projectBackupPayloadSchema,
    integrity: z
      .object({
        algorithm: z.literal('sha256'),
        payloadHash: z.string().regex(/^[a-f0-9]{64}$/)
      })
      .strict()
  })
  .strict();

export class ProjectBackupError extends Error {
  constructor(code, message, status = 422) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

export function payloadChecksum(payload) {
  return createHash('sha256').update(canonicalJson(payload), 'utf8').digest('hex');
}

export function collectionCounts(collections) {
  return Object.fromEntries(
    PROJECT_BACKUP_COLLECTIONS.map((name) => [name, collections[name].length])
  );
}

export function safeBackupFilename(projectName, exportedAt = new Date()) {
  const slug =
    projectName
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'projeto';
  const stamp = exportedAt
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .replace('Z', '');

  return `qabase-${slug}-${stamp}.qabase`;
}

export function validateBackupDocument(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ProjectBackupError(
      'INVALID_FILE',
      'O arquivo selecionado nao e um backup valido do QaBase.',
      400
    );
  }

  if (input.format !== PROJECT_BACKUP_FORMAT) {
    throw new ProjectBackupError(
      'INVALID_FORMAT',
      'O arquivo nao possui o formato de backup de projeto do QaBase.'
    );
  }

  if (input.version !== PROJECT_BACKUP_VERSION) {
    const message =
      Number(input.version) > PROJECT_BACKUP_VERSION
        ? 'Este backup foi criado por uma versao mais nova. Atualize o QaBase para restaura-lo.'
        : 'Esta versao de backup nao e mais suportada por este QaBase.';
    throw new ProjectBackupError('UNSUPPORTED_VERSION', message);
  }

  const parsed = projectBackupDocumentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ProjectBackupError(
      'INVALID_STRUCTURE',
      'O backup possui campos ausentes, desconhecidos ou com valores invalidos.'
    );
  }

  const document = parsed.data;
  const actualHash = payloadChecksum(document.payload);
  if (actualHash !== document.integrity.payloadHash) {
    throw new ProjectBackupError(
      'INTEGRITY_FAILURE',
      'A verificacao de integridade falhou. O arquivo pode estar incompleto ou alterado.'
    );
  }

  const actualCounts = collectionCounts(document.payload.collections);
  if (
    PROJECT_BACKUP_COLLECTIONS.some(
      (name) => actualCounts[name] !== document.manifest.counts[name]
    )
  ) {
    throw new ProjectBackupError(
      'COUNT_MISMATCH',
      'As contagens do manifesto nao correspondem ao conteudo do backup.'
    );
  }

  return document;
}
