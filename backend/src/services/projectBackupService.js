import { Prisma } from '@prisma/client';
import {
  PROJECT_BACKUP_COLLECTIONS,
  PROJECT_BACKUP_FORMAT,
  PROJECT_BACKUP_VERSION,
  ProjectBackupError,
  collectionCounts,
  payloadChecksum,
  safeBackupFilename,
  validateBackupDocument
} from './projectBackupContract.js';

const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'completedAt',
  'startDate',
  'dueDate',
  'executedAt',
  'registeredAt',
  'workaroundDeliveredAt',
  'productionReleasedAt',
  'closedAt'
]);

const REFERENCE_RULES = Object.freeze({
  suites: { parentRef: 'suites' },
  testCases: { suiteRef: 'suites' },
  testSteps: { testCaseRef: 'testCases' },
  testCaseComponents: {
    testCaseRef: 'testCases',
    componentRef: 'testComponents'
  },
  testPlanSections: { testPlanRef: 'testPlans' },
  testPlanItems: {
    testPlanRef: 'testPlans',
    sectionRef: 'testPlanSections',
    testCaseRef: 'testCases',
    dependsOnItemRef: 'testPlanItems'
  },
  configurationOptions: { groupRef: 'configurationGroups' },
  validationFolders: { parentRef: 'validationFolders' },
  validationBriefs: { folderRef: 'validationFolders' },
  validationCriteria: { briefRef: 'validationBriefs' },
  validationChecks: {
    briefRef: 'validationBriefs',
    testCaseRef: 'testCases'
  },
  validationNotes: { briefRef: 'validationBriefs' },
  runs: {
    testPlanRef: 'testPlans',
    milestoneRef: 'milestones',
    environmentRef: 'environments'
  },
  runPlanSections: { runRef: 'runs' },
  runTestCases: {
    runRef: 'runs',
    testCaseRef: 'testCases',
    runPlanSectionRef: 'runPlanSections',
    dependsOnRunCaseRef: 'runTestCases'
  },
  runConfigurations: {
    runRef: 'runs',
    optionRef: 'configurationOptions'
  },
  productionDemands: {
    validationBriefRef: 'validationBriefs',
    runRef: 'runs',
    milestoneRef: 'milestones',
    linkedAdRef: 'productionDemands'
  },
  productionDemandActivities: { demandRef: 'productionDemands' }
});

function ref(prefix, id) {
  return id == null ? null : `${prefix}:${id}`;
}

function jsonScalars(row) {
  return JSON.parse(JSON.stringify(row));
}

function portableEntity(row, prefix, { omit = [], references = {} } = {}) {
  const data = jsonScalars(row);
  const entity = { ref: ref(prefix, data.id) };
  delete data.id;

  for (const field of omit) {
    delete data[field];
  }

  for (const [field, [portableField, targetPrefix]] of Object.entries(references)) {
    entity[portableField] = ref(targetPrefix, data[field]);
    delete data[field];
  }

  return { ...entity, ...data };
}

async function readProjectGraph(client, projectId, ownerId) {
  return client.$transaction(
    async (transaction) => {
      const project = await transaction.project.findFirst({
        where: { id: projectId, ownerId }
      });
      if (!project) {
        throw new ProjectBackupError(
          'PROJECT_NOT_FOUND',
          'Projeto nao encontrado.',
          404
        );
      }

      const [
        suites,
        testCases,
        testSteps,
        testComponents,
        testCaseComponents,
        testPlans,
        testPlanSections,
        testPlanItems,
        milestones,
        environments,
        configurationGroups,
        configurationOptions,
        validationFolders,
        validationBriefs,
        validationCriteria,
        validationChecks,
        validationNotes,
        runs,
        runPlanSections,
        runTestCases,
        runConfigurations,
        productionDemands,
        productionDemandActivities
      ] = await Promise.all([
        transaction.suite.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
        transaction.testCase.findMany({
          where: { suite: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.testStep.findMany({
          where: { testCase: { suite: { projectId } } },
          orderBy: { id: 'asc' }
        }),
        transaction.testComponent.findMany({
          where: { projectId },
          orderBy: { id: 'asc' }
        }),
        transaction.testCaseComponent.findMany({
          where: { testCase: { suite: { projectId } } },
          orderBy: [{ testCaseId: 'asc' }, { componentId: 'asc' }]
        }),
        transaction.testPlan.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
        transaction.testPlanSection.findMany({
          where: { testPlan: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.testPlanItem.findMany({
          where: { testPlan: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.milestone.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
        transaction.environment.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
        transaction.configurationGroup.findMany({
          where: { projectId },
          orderBy: { id: 'asc' }
        }),
        transaction.configurationOption.findMany({
          where: { group: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.validationFolder.findMany({
          where: { projectId },
          orderBy: { id: 'asc' }
        }),
        transaction.validationBrief.findMany({
          where: { projectId },
          orderBy: { id: 'asc' }
        }),
        transaction.validationCriterion.findMany({
          where: { brief: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.validationCheck.findMany({
          where: { brief: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.validationNote.findMany({
          where: { brief: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.run.findMany({ where: { projectId }, orderBy: { id: 'asc' } }),
        transaction.runPlanSection.findMany({
          where: { run: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.runTestCase.findMany({
          where: { run: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.runConfiguration.findMany({
          where: { run: { projectId } },
          orderBy: { id: 'asc' }
        }),
        transaction.productionDemand.findMany({
          where: { projectId },
          orderBy: { id: 'asc' }
        }),
        transaction.productionDemandActivity.findMany({
          where: { demand: { projectId } },
          orderBy: { id: 'asc' }
        })
      ]);

      return {
        project,
        collections: {
          suites,
          testCases,
          testSteps,
          testComponents,
          testCaseComponents,
          testPlans,
          testPlanSections,
          testPlanItems,
          milestones,
          environments,
          configurationGroups,
          configurationOptions,
          validationFolders,
          validationBriefs,
          validationCriteria,
          validationChecks,
          validationNotes,
          runs,
          runPlanSections,
          runTestCases,
          runConfigurations,
          productionDemands,
          productionDemandActivities
        }
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000
    }
  );
}

function serializeGraph(graph) {
  const source = graph.collections;
  const {
    id: _projectId,
    ownerId: _ownerId,
    ...project
  } = jsonScalars(graph.project);
  const collections = {
    suites: source.suites.map((row) =>
      portableEntity(row, 'suite', {
        omit: ['projectId'],
        references: { parentId: ['parentRef', 'suite'] }
      })
    ),
    testCases: source.testCases.map((row) =>
      portableEntity(row, 'case', {
        references: { suiteId: ['suiteRef', 'suite'] }
      })
    ),
    testSteps: source.testSteps.map((row) =>
      portableEntity(row, 'step', {
        references: { testCaseId: ['testCaseRef', 'case'] }
      })
    ),
    testComponents: source.testComponents.map((row) =>
      portableEntity(row, 'component', { omit: ['projectId'] })
    ),
    testCaseComponents: source.testCaseComponents.map((row) => ({
      ref: `caseComponent:${row.testCaseId}:${row.componentId}`,
      testCaseRef: ref('case', row.testCaseId),
      componentRef: ref('component', row.componentId),
      createdAt: row.createdAt.toISOString()
    })),
    testPlans: source.testPlans.map((row) =>
      portableEntity(row, 'plan', { omit: ['projectId'] })
    ),
    testPlanSections: source.testPlanSections.map((row) =>
      portableEntity(row, 'planSection', {
        references: { testPlanId: ['testPlanRef', 'plan'] }
      })
    ),
    testPlanItems: source.testPlanItems.map((row) =>
      portableEntity(row, 'planItem', {
        references: {
          testPlanId: ['testPlanRef', 'plan'],
          sectionId: ['sectionRef', 'planSection'],
          testCaseId: ['testCaseRef', 'case'],
          dependsOnItemId: ['dependsOnItemRef', 'planItem']
        }
      })
    ),
    milestones: source.milestones.map((row) =>
      portableEntity(row, 'milestone', { omit: ['projectId'] })
    ),
    environments: source.environments.map((row) =>
      portableEntity(row, 'environment', { omit: ['projectId'] })
    ),
    configurationGroups: source.configurationGroups.map((row) =>
      portableEntity(row, 'configurationGroup', { omit: ['projectId'] })
    ),
    configurationOptions: source.configurationOptions.map((row) =>
      portableEntity(row, 'configurationOption', {
        references: { groupId: ['groupRef', 'configurationGroup'] }
      })
    ),
    validationFolders: source.validationFolders.map((row) =>
      portableEntity(row, 'validationFolder', {
        omit: ['projectId'],
        references: { parentId: ['parentRef', 'validationFolder'] }
      })
    ),
    validationBriefs: source.validationBriefs.map((row) =>
      portableEntity(row, 'validationBrief', {
        omit: ['projectId'],
        references: { folderId: ['folderRef', 'validationFolder'] }
      })
    ),
    validationCriteria: source.validationCriteria.map((row) =>
      portableEntity(row, 'validationCriterion', {
        references: { briefId: ['briefRef', 'validationBrief'] }
      })
    ),
    validationChecks: source.validationChecks.map((row) =>
      portableEntity(row, 'validationCheck', {
        references: {
          briefId: ['briefRef', 'validationBrief'],
          testCaseId: ['testCaseRef', 'case']
        }
      })
    ),
    validationNotes: source.validationNotes.map((row) =>
      portableEntity(row, 'validationNote', {
        references: { briefId: ['briefRef', 'validationBrief'] }
      })
    ),
    runs: source.runs.map((row) =>
      portableEntity(row, 'run', {
        omit: ['projectId'],
        references: {
          testPlanId: ['testPlanRef', 'plan'],
          milestoneId: ['milestoneRef', 'milestone'],
          environmentId: ['environmentRef', 'environment']
        }
      })
    ),
    runPlanSections: source.runPlanSections.map((row) =>
      portableEntity(row, 'runPlanSection', {
        references: { runId: ['runRef', 'run'] }
      })
    ),
    runTestCases: source.runTestCases.map((row) =>
      portableEntity(row, 'runCase', {
        references: {
          runId: ['runRef', 'run'],
          testCaseId: ['testCaseRef', 'case'],
          runPlanSectionId: ['runPlanSectionRef', 'runPlanSection'],
          dependsOnRunTestCaseId: ['dependsOnRunCaseRef', 'runCase']
        }
      })
    ),
    runConfigurations: source.runConfigurations.map((row) =>
      portableEntity(row, 'runConfiguration', {
        references: {
          runId: ['runRef', 'run'],
          optionId: ['optionRef', 'configurationOption']
        }
      })
    ),
    productionDemands: [],
    productionDemandActivities: []
  };

  return {
    project,
    collections
  };
}

function assertUnique(items, keyFor, label) {
  const seen = new Set();
  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) {
      throw new ProjectBackupError(
        'INVALID_STRUCTURE',
        `O backup possui ${label} duplicado.`
      );
    }
    seen.add(key);
  }
}

function assertAcyclic(items, parentField, label) {
  const parentByRef = new Map(items.map((item) => [item.ref, item[parentField]]));

  for (const item of items) {
    const visited = new Set();
    let current = item.ref;
    while (current) {
      if (visited.has(current)) {
        throw new ProjectBackupError(
          'INVALID_STRUCTURE',
          `O backup possui um ciclo em ${label}.`
        );
      }
      visited.add(current);
      current = parentByRef.get(current) || null;
    }
  }
}

export function validateBackupRelations(document) {
  const collections = document.payload.collections;
  const refsByCollection = Object.fromEntries(
    PROJECT_BACKUP_COLLECTIONS.map((name) => [
      name,
      new Set(collections[name].map((item) => item.ref))
    ])
  );
  const allRefs = new Set();

  for (const collectionName of PROJECT_BACKUP_COLLECTIONS) {
    for (const item of collections[collectionName]) {
      if (allRefs.has(item.ref)) {
        throw new ProjectBackupError(
          'INVALID_STRUCTURE',
          'O backup possui referencias portateis duplicadas.'
        );
      }
      allRefs.add(item.ref);

      for (const [field, targetCollection] of Object.entries(
        REFERENCE_RULES[collectionName] || {}
      )) {
        const targetRef = item[field];
        if (targetRef && !refsByCollection[targetCollection].has(targetRef)) {
          throw new ProjectBackupError(
            'INVALID_STRUCTURE',
            `A referencia ${field} de ${item.ref} nao existe no backup.`
          );
        }
      }
    }
  }

  assertAcyclic(collections.suites, 'parentRef', 'hierarquia de suites');
  assertAcyclic(
    collections.validationFolders,
    'parentRef',
    'hierarquia de pastas de validacao'
  );
  assertAcyclic(
    collections.testPlanItems,
    'dependsOnItemRef',
    'dependencias do plano'
  );
  assertAcyclic(
    collections.runTestCases,
    'dependsOnRunCaseRef',
    'dependencias da execucao'
  );
  assertAcyclic(
    collections.productionDemands,
    'linkedAdRef',
    'vinculos entre demandas'
  );

  assertUnique(collections.testSteps, (item) => `${item.testCaseRef}:${item.position}`, 'passo');
  assertUnique(collections.testComponents, (item) => item.position, 'posicao de componente');
  assertUnique(collections.testComponents, (item) => item.normalizedName, 'componente');
  assertUnique(
    collections.testCaseComponents,
    (item) => `${item.testCaseRef}:${item.componentRef}`,
    'vinculo de componente'
  );
  assertUnique(collections.testPlans, (item) => item.name, 'nome de plano');
  assertUnique(
    collections.testPlanSections,
    (item) => `${item.testPlanRef}:${item.position}`,
    'posicao de secao de plano'
  );
  assertUnique(
    collections.testPlanItems,
    (item) => `${item.sectionRef}:${item.position}`,
    'posicao de item de plano'
  );
  assertUnique(collections.milestones, (item) => item.name, 'nome de marco');
  assertUnique(collections.environments, (item) => item.name, 'nome de ambiente');
  assertUnique(collections.configurationGroups, (item) => item.name, 'grupo de configuracao');
  assertUnique(collections.configurationGroups, (item) => item.position, 'posicao de configuracao');
  assertUnique(
    collections.configurationOptions,
    (item) => `${item.groupRef}:${item.name}`,
    'opcao de configuracao'
  );
  assertUnique(
    collections.validationCriteria,
    (item) => `${item.briefRef}:${item.position}`,
    'posicao de criterio'
  );
  assertUnique(
    collections.validationChecks,
    (item) => `${item.briefRef}:${item.position}`,
    'posicao de check'
  );
  assertUnique(
    collections.runPlanSections,
    (item) => `${item.runRef}:${item.position}`,
    'posicao de secao executada'
  );
  assertUnique(
    collections.runTestCases.filter((item) => item.runPlanSectionRef),
    (item) => `${item.runPlanSectionRef}:${item.position}`,
    'posicao de caso executado'
  );
  assertUnique(
    collections.runConfigurations,
    (item) => `${item.runRef}:${item.position}`,
    'posicao de configuracao executada'
  );
  assertUnique(
    collections.productionDemands,
    (item) => `${item.type}:${item.normalizedCode}`,
    'codigo de demanda'
  );

  return document;
}

export async function buildProjectBackup(
  client,
  projectId,
  ownerId,
  now = new Date()
) {
  const graph = await readProjectGraph(client, projectId, ownerId);
  const payload = serializeGraph(graph);
  const document = {
    format: PROJECT_BACKUP_FORMAT,
    version: PROJECT_BACKUP_VERSION,
    manifest: {
      application: 'QaBase',
      exportedAt: now.toISOString(),
      sourceProjectName: graph.project.name,
      counts: collectionCounts(payload.collections)
    },
    payload,
    integrity: {
      algorithm: 'sha256',
      payloadHash: payloadChecksum(payload)
    }
  };

  validateBackupRelations(validateBackupDocument(document));

  return {
    document,
    filename: safeBackupFilename(graph.project.name, now)
  };
}

export function parseProjectBackup(input) {
  return validateBackupRelations(validateBackupDocument(input));
}

function scalarData(entity, omitted = []) {
  const data = {};
  const ignored = new Set(['ref', ...omitted]);

  for (const [key, value] of Object.entries(entity)) {
    if (ignored.has(key) || key.endsWith('Ref')) continue;
    data[key] = DATE_FIELDS.has(key) && value ? new Date(value) : value;
  }

  return data;
}

function idFrom(maps, collection, portableRef, optional = false) {
  if (!portableRef && optional) return null;
  const id = maps[collection].get(portableRef);
  if (!id) {
    throw new ProjectBackupError(
      'INVALID_STRUCTURE',
      `A referencia ${portableRef || 'vazia'} nao pode ser restaurada.`
    );
  }
  return id;
}

async function createMapped(transaction, maps, collection, model, entity, data) {
  const created = await transaction[model].create({ data });
  maps[collection].set(entity.ref, created.id);
  return created;
}

export async function suggestRestoredProjectName(client, sourceName, ownerId) {
  const base = `${sourceName} - restaurado`;
  const projects = await client.project.findMany({
    where: { ownerId },
    select: { name: true }
  });
  const names = new Set(projects.map((project) => project.name.toLocaleLowerCase('pt-BR')));

  if (!names.has(base.toLocaleLowerCase('pt-BR'))) return base;

  let suffix = 2;
  while (names.has(`${base} (${suffix})`.toLocaleLowerCase('pt-BR'))) {
    suffix += 1;
  }
  return `${base} (${suffix})`;
}

export function projectBackupPreview(document, { sizeBytes, suggestedName }) {
  const omittedDemandCount =
    document.payload.collections.productionDemands.length;
  return {
    format: document.format,
    version: document.version,
    exportedAt: document.manifest.exportedAt,
    sourceProjectName: document.manifest.sourceProjectName,
    counts: document.manifest.counts,
    checksum: document.integrity.payloadHash,
    sizeBytes,
    suggestedName,
    warnings: [
      'O backup sera restaurado como um novo projeto.',
      ...(omittedDemandCount
        ? [
            `${omittedDemandCount} demanda(s) AD/MF serao ignoradas nesta edicao de demonstracao.`
          ]
        : []),
      'O arquivo nao e criptografado e deve ser armazenado em local protegido.'
    ]
  };
}

export async function restoreProjectBackup(
  client,
  input,
  restoredName,
  { failAfterCollection = null, ownerId } = {}
) {
  if (!ownerId) {
    throw new ProjectBackupError(
      'BACKUP_OWNER_REQUIRED',
      'Nao foi possivel identificar o proprietario do projeto.',
      401
    );
  }
  const document = parseProjectBackup(input);
  const collections = {
    ...document.payload.collections,
    productionDemands: [],
    productionDemandActivities: []
  };

  return client.$transaction(
    async (transaction) => {
      const maps = Object.fromEntries(
        PROJECT_BACKUP_COLLECTIONS.map((name) => [name, new Map()])
      );
      const sourceProject = document.payload.project;
      const project = await transaction.project.create({
        data: {
          ownerId,
          name: restoredName,
          description: sourceProject.description,
          createdAt: new Date(sourceProject.createdAt),
          updatedAt: new Date(sourceProject.updatedAt)
        }
      });

      for (const entity of collections.testComponents) {
        await createMapped(transaction, maps, 'testComponents', 'testComponent', entity, {
          ...scalarData(entity),
          projectId: project.id
        });
      }
      for (const entity of collections.milestones) {
        await createMapped(transaction, maps, 'milestones', 'milestone', entity, {
          ...scalarData(entity),
          projectId: project.id
        });
      }
      for (const entity of collections.environments) {
        await createMapped(transaction, maps, 'environments', 'environment', entity, {
          ...scalarData(entity),
          projectId: project.id
        });
      }
      for (const entity of collections.configurationGroups) {
        await createMapped(
          transaction,
          maps,
          'configurationGroups',
          'configurationGroup',
          entity,
          { ...scalarData(entity), projectId: project.id }
        );
      }
      for (const entity of collections.configurationOptions) {
        await createMapped(
          transaction,
          maps,
          'configurationOptions',
          'configurationOption',
          entity,
          {
            ...scalarData(entity),
            groupId: idFrom(maps, 'configurationGroups', entity.groupRef)
          }
        );
      }
      for (const entity of collections.suites) {
        await createMapped(transaction, maps, 'suites', 'suite', entity, {
          ...scalarData(entity),
          projectId: project.id,
          parentId: null
        });
      }
      for (const entity of collections.suites.filter((item) => item.parentRef)) {
        await transaction.suite.update({
          where: { id: idFrom(maps, 'suites', entity.ref) },
          data: {
            parentId: idFrom(maps, 'suites', entity.parentRef),
            updatedAt: new Date(entity.updatedAt)
          }
        });
      }
      for (const entity of collections.testCases) {
        await createMapped(transaction, maps, 'testCases', 'testCase', entity, {
          ...scalarData(entity),
          suiteId: idFrom(maps, 'suites', entity.suiteRef)
        });
      }
      for (const entity of collections.testSteps) {
        await createMapped(transaction, maps, 'testSteps', 'testStep', entity, {
          ...scalarData(entity),
          testCaseId: idFrom(maps, 'testCases', entity.testCaseRef)
        });
      }
      if (failAfterCollection === 'testCases') {
        throw new Error('Falha de restauracao simulada para teste');
      }
      for (const entity of collections.testCaseComponents) {
        await transaction.testCaseComponent.create({
          data: {
            testCaseId: idFrom(maps, 'testCases', entity.testCaseRef),
            componentId: idFrom(maps, 'testComponents', entity.componentRef),
            createdAt: new Date(entity.createdAt)
          }
        });
      }
      for (const entity of collections.testPlans) {
        await createMapped(transaction, maps, 'testPlans', 'testPlan', entity, {
          ...scalarData(entity),
          projectId: project.id
        });
      }
      for (const entity of collections.testPlanSections) {
        await createMapped(
          transaction,
          maps,
          'testPlanSections',
          'testPlanSection',
          entity,
          {
            ...scalarData(entity),
            testPlanId: idFrom(maps, 'testPlans', entity.testPlanRef)
          }
        );
      }
      for (const entity of collections.testPlanItems) {
        await createMapped(
          transaction,
          maps,
          'testPlanItems',
          'testPlanItem',
          entity,
          {
            ...scalarData(entity),
            testPlanId: idFrom(maps, 'testPlans', entity.testPlanRef),
            sectionId: idFrom(maps, 'testPlanSections', entity.sectionRef),
            testCaseId: idFrom(maps, 'testCases', entity.testCaseRef),
            dependsOnItemId: null
          }
        );
      }
      for (const entity of collections.testPlanItems.filter((item) => item.dependsOnItemRef)) {
        await transaction.testPlanItem.update({
          where: { id: idFrom(maps, 'testPlanItems', entity.ref) },
          data: {
            dependsOnItemId: idFrom(maps, 'testPlanItems', entity.dependsOnItemRef),
            updatedAt: new Date(entity.updatedAt)
          }
        });
      }
      for (const entity of collections.validationFolders) {
        await createMapped(
          transaction,
          maps,
          'validationFolders',
          'validationFolder',
          entity,
          { ...scalarData(entity), projectId: project.id, parentId: null }
        );
      }
      for (const entity of collections.validationFolders.filter((item) => item.parentRef)) {
        await transaction.validationFolder.update({
          where: { id: idFrom(maps, 'validationFolders', entity.ref) },
          data: {
            parentId: idFrom(maps, 'validationFolders', entity.parentRef),
            updatedAt: new Date(entity.updatedAt)
          }
        });
      }
      for (const entity of collections.validationBriefs) {
        await createMapped(
          transaction,
          maps,
          'validationBriefs',
          'validationBrief',
          entity,
          {
            ...scalarData(entity),
            projectId: project.id,
            folderId: idFrom(maps, 'validationFolders', entity.folderRef, true)
          }
        );
      }
      for (const entity of collections.validationCriteria) {
        await createMapped(
          transaction,
          maps,
          'validationCriteria',
          'validationCriterion',
          entity,
          {
            ...scalarData(entity),
            briefId: idFrom(maps, 'validationBriefs', entity.briefRef)
          }
        );
      }
      for (const entity of collections.validationChecks) {
        await createMapped(
          transaction,
          maps,
          'validationChecks',
          'validationCheck',
          entity,
          {
            ...scalarData(entity),
            briefId: idFrom(maps, 'validationBriefs', entity.briefRef),
            testCaseId: idFrom(maps, 'testCases', entity.testCaseRef, true)
          }
        );
      }
      for (const entity of collections.validationNotes) {
        await createMapped(
          transaction,
          maps,
          'validationNotes',
          'validationNote',
          entity,
          {
            ...scalarData(entity),
            briefId: idFrom(maps, 'validationBriefs', entity.briefRef)
          }
        );
      }
      for (const entity of collections.runs) {
        await createMapped(transaction, maps, 'runs', 'run', entity, {
          ...scalarData(entity),
          projectId: project.id,
          testPlanId: idFrom(maps, 'testPlans', entity.testPlanRef, true),
          milestoneId: idFrom(maps, 'milestones', entity.milestoneRef, true),
          environmentId: idFrom(maps, 'environments', entity.environmentRef, true)
        });
      }
      for (const entity of collections.runPlanSections) {
        await createMapped(
          transaction,
          maps,
          'runPlanSections',
          'runPlanSection',
          entity,
          {
            ...scalarData(entity),
            runId: idFrom(maps, 'runs', entity.runRef)
          }
        );
      }
      for (const entity of collections.runTestCases) {
        await createMapped(
          transaction,
          maps,
          'runTestCases',
          'runTestCase',
          entity,
          {
            ...scalarData(entity),
            runId: idFrom(maps, 'runs', entity.runRef),
            testCaseId: idFrom(maps, 'testCases', entity.testCaseRef, true),
            runPlanSectionId: idFrom(
              maps,
              'runPlanSections',
              entity.runPlanSectionRef,
              true
            ),
            dependsOnRunTestCaseId: null
          }
        );
      }
      for (const entity of collections.runTestCases.filter(
        (item) => item.dependsOnRunCaseRef
      )) {
        await transaction.runTestCase.update({
          where: { id: idFrom(maps, 'runTestCases', entity.ref) },
          data: {
            dependsOnRunTestCaseId: idFrom(
              maps,
              'runTestCases',
              entity.dependsOnRunCaseRef
            ),
            updatedAt: new Date(entity.updatedAt)
          }
        });
      }
      for (const entity of collections.runConfigurations) {
        await createMapped(
          transaction,
          maps,
          'runConfigurations',
          'runConfiguration',
          entity,
          {
            ...scalarData(entity),
            runId: idFrom(maps, 'runs', entity.runRef),
            optionId: idFrom(maps, 'configurationOptions', entity.optionRef, true)
          }
        );
      }
      for (const entity of collections.productionDemands) {
        await createMapped(
          transaction,
          maps,
          'productionDemands',
          'productionDemand',
          entity,
          {
            ...scalarData(entity),
            projectId: project.id,
            validationBriefId: idFrom(
              maps,
              'validationBriefs',
              entity.validationBriefRef,
              true
            ),
            runId: idFrom(maps, 'runs', entity.runRef, true),
            milestoneId: idFrom(maps, 'milestones', entity.milestoneRef, true),
            linkedAdId: null
          }
        );
      }
      for (const entity of collections.productionDemands.filter(
        (item) => item.linkedAdRef
      )) {
        await transaction.productionDemand.update({
          where: { id: idFrom(maps, 'productionDemands', entity.ref) },
          data: {
            linkedAdId: idFrom(maps, 'productionDemands', entity.linkedAdRef),
            updatedAt: new Date(entity.updatedAt)
          }
        });
      }
      for (const entity of collections.productionDemandActivities) {
        await createMapped(
          transaction,
          maps,
          'productionDemandActivities',
          'productionDemandActivity',
          entity,
          {
            ...scalarData(entity),
            demandId: idFrom(maps, 'productionDemands', entity.demandRef)
          }
        );
      }

      return {
        project,
        counts: collectionCounts(collections)
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000,
      timeout: 120000
    }
  );
}

export const projectBackupInternals = {
  readProjectGraph,
  serializeGraph
};
