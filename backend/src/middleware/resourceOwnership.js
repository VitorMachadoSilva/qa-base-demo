import { prisma } from '../db/client.js';

const ACCESS_RESOLVERS = Object.freeze({
  projects: (id, ownerId) =>
    prisma.project.findFirst({ where: { id, ownerId }, select: { id: true } }),
  suites: (id, ownerId) =>
    prisma.suite.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  cases: (id, ownerId) =>
    prisma.testCase.findFirst({
      where: { id, suite: { project: { ownerId } } },
      select: { id: true }
    }),
  components: (id, ownerId) =>
    prisma.testComponent.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  plans: (id, ownerId) =>
    prisma.testPlan.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  milestones: (id, ownerId) =>
    prisma.milestone.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  environments: (id, ownerId) =>
    prisma.environment.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  'configuration-groups': (id, ownerId) =>
    prisma.configurationGroup.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  'configuration-options': (id, ownerId) =>
    prisma.configurationOption.findFirst({
      where: { id, group: { project: { ownerId } } },
      select: { id: true }
    }),
  runs: (id, ownerId) =>
    prisma.run.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  'run-cases': (id, ownerId) =>
    prisma.runTestCase.findFirst({
      where: { id, run: { project: { ownerId } } },
      select: { id: true }
    }),
  'validation-folders': (id, ownerId) =>
    prisma.validationFolder.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  'validation-briefs': (id, ownerId) =>
    prisma.validationBrief.findFirst({
      where: { id, project: { ownerId } },
      select: { id: true }
    }),
  'validation-criteria': (id, ownerId) =>
    prisma.validationCriterion.findFirst({
      where: { id, brief: { project: { ownerId } } },
      select: { id: true }
    }),
  'validation-checks': (id, ownerId) =>
    prisma.validationCheck.findFirst({
      where: { id, brief: { project: { ownerId } } },
      select: { id: true }
    }),
  'validation-notes': (id, ownerId) =>
    prisma.validationNote.findFirst({
      where: { id, brief: { project: { ownerId } } },
      select: { id: true }
    })
});

function resourceFromRequest(req) {
  const path = req.originalUrl.split('?')[0].replace(/^\/api\/?/, '');
  const segments = path.split('/').filter(Boolean);

  for (let index = 0; index < segments.length - 1; index += 1) {
    const resolveAccess = ACCESS_RESOLVERS[segments[index]];
    const id = Number(segments[index + 1]);
    if (resolveAccess && Number.isSafeInteger(id) && id > 0) {
      return { id, resolveAccess };
    }
  }

  return null;
}

export async function requireOwnedResource(req, res, next) {
  try {
    const resource = resourceFromRequest(req);
    if (!resource) return next();

    const allowed = await resource.resolveAccess(resource.id, req.user.id);
    if (!allowed) {
      return res.status(404).json({ error: 'Recurso nao encontrado' });
    }

    next();
  } catch (error) {
    next(error);
  }
}

export const resourceOwnershipInternals = { resourceFromRequest };
