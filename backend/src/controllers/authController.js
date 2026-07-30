import { LOGIN_TIMING_HASH, safeUser } from '../auth/fixedAccounts.js';
import {
  clearLoginFailures,
  isLoginBlocked,
  loginAttemptKey,
  registerLoginFailure
} from '../auth/loginThrottle.js';
import { derivePassword, verifyPassword } from '../auth/passwords.js';
import {
  clearSessionCookie,
  replaceUserSessions,
  revokeRequestSession
} from '../auth/sessions.js';
import { prisma } from '../db/client.js';
import { sendError } from '../utils/http.js';
import {
  loginSchema,
  passwordChangeSchema,
  validate
} from '../validation/schemas.js';

const GENERIC_LOGIN_ERROR = 'Login ou senha invalidos';

export async function login(req, res) {
  try {
    const data = validate(loginSchema, req.body);
    const email = data.email.toLowerCase();
    const attemptKey = loginAttemptKey(req, email);

    if (isLoginBlocked(attemptKey)) {
      return res
        .status(429)
        .json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = await verifyPassword(
      data.password,
      user?.passwordHash || LOGIN_TIMING_HASH
    );

    if (
      !user ||
      !user.active ||
      (user.expiresAt && user.expiresAt <= new Date()) ||
      !passwordMatches
    ) {
      registerLoginFailure(attemptKey);
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    clearLoginFailures(attemptKey);
    await replaceUserSessions(user.id, res);
    res.json({ user: safeUser(user) });
  } catch (error) {
    sendError(res, error);
  }
}

export function currentSession(req, res) {
  res.json({ user: safeUser(req.user) });
}

export async function logout(req, res) {
  try {
    await revokeRequestSession(req);
    clearSessionCookie(res);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
}

export async function changePassword(req, res) {
  try {
    const data = validate(passwordChangeSchema, req.body);
    const matches = await verifyPassword(
      data.currentPassword,
      req.user.passwordHash
    );

    if (!matches) {
      return res.status(400).json({ error: 'A senha atual esta incorreta' });
    }

    const passwordHash = await derivePassword(data.newPassword);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordNoticeSeenAt: req.user.passwordNoticeSeenAt || new Date()
      }
    });

    await replaceUserSessions(user.id, res);
    res.json({
      user: safeUser(user),
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function acknowledgePasswordNotice(req, res) {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordNoticeSeenAt: req.user.passwordNoticeSeenAt || new Date()
      }
    });

    res.json({ user: safeUser(user) });
  } catch (error) {
    sendError(res, error);
  }
}
