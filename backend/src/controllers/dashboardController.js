import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';

function summarize(items) {
  const summary = {
    total: items.length,
    executed: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: 0,
    completionPercentage: 0
  };

  items.forEach((item) => {
    const key = item.status.toLowerCase();

    if (key in summary) {
      summary[key] += 1;
    }
  });

  summary.executed = summary.total - summary.untested;
  summary.completionPercentage = summary.total
    ? Math.round((summary.executed / summary.total) * 100)
    : 0;

  return summary;
}

export async function getDashboard(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user.id },
      select: { id: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto nao encontrado' });
    }

    const [totalSuites, totalCases, totalRuns, activeRuns, completedRuns, lastRun] =
      await Promise.all([
        prisma.suite.count({ where: { projectId } }),
        prisma.testCase.count({
          where: {
            suite: { projectId }
          }
        }),
        prisma.run.count({ where: { projectId } }),
        prisma.run.count({ where: { projectId, status: 'Active' } }),
        prisma.run.count({ where: { projectId, status: 'Completed' } }),
        prisma.run.findFirst({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
          include: {
            runTestCases: {
              select: { status: true }
            }
          }
        })
      ]);

    const lastRunSummary = summarize(lastRun?.runTestCases || []);

    res.json({
      totalSuites,
      totalCases,
      totalRuns,
      activeRuns,
      completedRuns,
      lastRunSummary,
      latestRun: lastRun
        ? {
            id: lastRun.id,
            name: lastRun.name,
            status: lastRun.status,
            createdAt: lastRun.createdAt,
            completedAt: lastRun.completedAt,
            summary: lastRunSummary
          }
        : null
    });
  } catch (error) {
    sendError(res, error);
  }
}
