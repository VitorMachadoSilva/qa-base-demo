import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  configuredFrontendOrigins,
  requireAuthentication,
  requireMutationOrigin
} from './middleware/authentication.js';
import {
  protectedAuthRouter,
  publicAuthRouter
} from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { projectBackupsRouter } from './routes/projectBackups.js';
import { projectsRouter } from './routes/projects.js';
import { planningRouter } from './routes/planning.js';
import { quickNotesRouter } from './routes/quickNotes.js';
import { runsRouter } from './routes/runs.js';
import { suitesRouter } from './routes/suites.js';
import { testCasesRouter } from './routes/testCases.js';
import { testComponentsRouter } from './routes/testComponents.js';
import { testPlansRouter } from './routes/testPlans.js';
import { validationBriefsRouter } from './routes/validationBriefs.js';
import { requireOwnedResource } from './middleware/resourceOwnership.js';
import {
  PROJECT_BACKUP_LIMIT_BYTES,
  PROJECT_BACKUP_MIME
} from './services/projectBackupContract.js';

export const app = express();
app.disable('x-powered-by');

const frontendOrigins = configuredFrontendOrigins();
const trustProxy = String(process.env.QABASE_TRUST_PROXY || '').trim();

if (trustProxy === 'true' || process.env.VERCEL) {
  app.set('trust proxy', 1);
} else if (/^\d+$/.test(trustProxy)) {
  app.set('trust proxy', Number(trustProxy));
}

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || frontendOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  })
);
app.use(
  '/api/project-backups',
  requireAuthentication,
  requireMutationOrigin,
  express.json({
    limit: PROJECT_BACKUP_LIMIT_BYTES,
    strict: true,
    type: PROJECT_BACKUP_MIME
  }),
  projectBackupsRouter
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', requireMutationOrigin, publicAuthRouter);
app.use(
  '/api',
  requireAuthentication,
  requireMutationOrigin,
  requireOwnedResource
);
app.use('/api/auth', protectedAuthRouter);
app.use('/api/projects', projectsRouter);
app.use('/api', suitesRouter);
app.use('/api', testCasesRouter);
app.use('/api', testComponentsRouter);
app.use('/api', testPlansRouter);
app.use('/api', planningRouter);
app.use('/api', quickNotesRouter);
app.use('/api', runsRouter);
app.use('/api', dashboardRouter);
app.use('/api', validationBriefsRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});

if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const frontendDist =
    process.env.QABASE_FRONTEND_DIST ||
    fileURLToPath(new URL('../../frontend/dist', import.meta.url));

  if (!existsSync(frontendDist)) {
    throw new Error(
      `Frontend de producao nao encontrado em ${frontendDist}. Execute o build antes de iniciar.`
    );
  }

  app.use(
    express.static(frontendDist, {
      index: false,
      maxAge: '1d'
    })
  );
  app.get('*', (req, res, next) => {
    res.sendFile('index.html', { root: frontendDist }, (error) => {
      if (error) next(error);
    });
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota nao encontrada' });
  });
}

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isProjectBackupRoute = req.originalUrl.startsWith('/api/project-backups');

  if (error?.type === 'entity.too.large') {
    res.status(413).json({
      error: isProjectBackupRoute
        ? 'O backup excede o limite de 50 MiB.'
        : 'A requisicao excede o limite permitido.',
      code: isProjectBackupRoute ? 'BACKUP_TOO_LARGE' : 'REQUEST_TOO_LARGE'
    });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    res.status(400).json({
      error: isProjectBackupRoute
        ? 'O arquivo selecionado nao contem um JSON valido.'
        : 'A requisicao nao contem um JSON valido.',
      code: isProjectBackupRoute ? 'INVALID_JSON' : 'INVALID_REQUEST_JSON'
    });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

export default app;
