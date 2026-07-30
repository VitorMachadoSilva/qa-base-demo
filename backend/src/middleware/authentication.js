import {
  clearSessionCookie,
  resolveSession
} from '../auth/sessions.js';

export async function requireAuthentication(req, res, next) {
  try {
    const session = await resolveSession(req);

    if (!session) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Sessao invalida ou expirada' });
    }

    req.session = session;
    req.user = session.user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}

export function configuredFrontendOrigins() {
  const configured = String(process.env.QABASE_FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...configured
  ]);
}

export function requireMutationOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin');

  if (
    !origin ||
    configuredFrontendOrigins().has(origin) ||
    originMatchesRequestHost(req, origin)
  ) {
    return next();
  }

  return res.status(403).json({ error: 'Origem da requisicao nao autorizada' });
}

export function originMatchesRequestHost(req, origin) {
  const host = req.get('host');
  if (!host) return false;

  try {
    return (
      new URL(origin).origin === new URL(`${req.protocol}://${host}`).origin
    );
  } catch {
    return false;
  }
}
