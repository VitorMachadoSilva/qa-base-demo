import { prisma } from '../db/client.js';
import {
  PROJECT_BACKUP_MIME,
  ProjectBackupError
} from '../services/projectBackupContract.js';
import {
  buildProjectBackup,
  parseProjectBackup,
  projectBackupPreview,
  restoreProjectBackup,
  suggestRestoredProjectName
} from '../services/projectBackupService.js';
import { parseId } from '../utils/http.js';

function sendBackupError(res, error) {
  if (error instanceof ProjectBackupError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: 'Nao foi possivel processar o backup do projeto.',
    code: 'BACKUP_PROCESSING_FAILURE'
  });
}

function requestSize(req) {
  const contentLength = Number(req.get('content-length'));
  return Number.isFinite(contentLength) && contentLength > 0
    ? contentLength
    : Buffer.byteLength(JSON.stringify(req.body), 'utf8');
}

function restoredName(value) {
  const name = String(value || '').trim();
  if (name.length < 3) {
    throw new ProjectBackupError(
      'INVALID_PROJECT_NAME',
      'O nome restaurado deve ter pelo menos 3 caracteres.',
      400
    );
  }
  return name;
}

export async function exportProjectBackup(req, res) {
  try {
    const projectId = parseId(req.params.id, 'projectId');
    const backup = await buildProjectBackup(prisma, projectId, req.user.id);
    const content = JSON.stringify(backup.document, null, 2);

    res
      .status(200)
      .set({
        'Content-Type': `${PROJECT_BACKUP_MIME}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${backup.filename}"`,
        'Cache-Control': 'no-store'
      })
      .send(content);
  } catch (error) {
    sendBackupError(res, error);
  }
}

export async function previewProjectBackup(req, res) {
  try {
    const document = parseProjectBackup(req.body);
    const suggestedName = await suggestRestoredProjectName(
      prisma,
      document.manifest.sourceProjectName,
      req.user.id
    );

    res.json(
      projectBackupPreview(document, {
        sizeBytes: requestSize(req),
        suggestedName
      })
    );
  } catch (error) {
    sendBackupError(res, error);
  }
}

export async function importProjectBackup(req, res) {
  try {
    const name = restoredName(req.query.name);
    const result = await restoreProjectBackup(prisma, req.body, name, {
      ownerId: req.user.id
    });
    res.status(201).json(result);
  } catch (error) {
    sendBackupError(res, error);
  }
}
