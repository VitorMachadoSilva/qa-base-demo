import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../db/client.js';

export const SESSION_COOKIE_NAME = 'qabase.sid';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        const key = separator >= 0 ? part.slice(0, separator) : part;
        const value = separator >= 0 ? part.slice(separator + 1) : '';
        return [decodeURIComponent(key), decodeURIComponent(value)];
      })
  );
}

function cookieAttributes({ expires, clear = false } = {}) {
  const attributes = [
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${clear ? 0 : Math.floor(SESSION_TTL_MS / 1000)}`
  ];

  if (expires) {
    attributes.push(`Expires=${expires.toUTCString()}`);
  }

  if (
    process.env.QABASE_SECURE_COOKIES === 'true' ||
    Boolean(process.env.VERCEL)
  ) {
    attributes.push('Secure');
  }

  return attributes;
}

export function sessionTokenFromRequest(req) {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME] || null;
}

export function setSessionCookie(res, token, expires) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes({
      expires
    }).join('; ')}`
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; ${cookieAttributes({
      expires: new Date(0),
      clear: true
    }).join('; ')}`
  );
}

export async function createSession(userId, res, now = new Date()) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: tokenHash(token),
      expiresAt,
      lastSeenAt: now
    }
  });

  setSessionCookie(res, token, expiresAt);
  return session;
}

export async function resolveSession(req, now = new Date()) {
  const token = sessionTokenFromRequest(req);

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true }
  });

  if (
    !session ||
    !session.user.active ||
    (session.user.expiresAt && session.user.expiresAt <= now) ||
    session.expiresAt <= now
  ) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session;
}

export async function revokeRequestSession(req) {
  const token = sessionTokenFromRequest(req);

  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: { tokenHash: tokenHash(token) }
  });
}

export async function replaceUserSessions(userId, res) {
  await prisma.session.deleteMany({ where: { userId } });
  return createSession(userId, res);
}

export async function removeExpiredSessions(now = new Date()) {
  return prisma.session.deleteMany({
    where: { expiresAt: { lte: now } }
  });
}

export const sessionInternals = {
  parseCookies,
  tokenHash
};
