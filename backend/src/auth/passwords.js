import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SCHEME = 'scrypt-v1';
const KEY_LENGTH = 64;
const PARAMS = Object.freeze({
  N: 32768,
  r: 8,
  p: 3,
  maxmem: 128 * 1024 * 1024
});

function normalizedPassword(password) {
  return String(password).normalize('NFKC');
}

function encode(buffer) {
  return buffer.toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url');
}

export async function derivePassword(password, salt = randomBytes(16)) {
  const derived = await scrypt(normalizedPassword(password), salt, KEY_LENGTH, PARAMS);

  return [
    SCHEME,
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    encode(salt),
    encode(derived)
  ].join('$');
}

export async function verifyPassword(password, encodedHash) {
  try {
    const [scheme, rawN, rawR, rawP, rawSalt, rawDerived, ...extra] =
      String(encodedHash).split('$');

    if (scheme !== SCHEME || !rawDerived || extra.length > 0) {
      return false;
    }

    const salt = decode(rawSalt);
    const expected = decode(rawDerived);
    const params = {
      N: Number(rawN),
      r: Number(rawR),
      p: Number(rawP),
      maxmem: PARAMS.maxmem
    };

    if (
      !Number.isInteger(params.N) ||
      !Number.isInteger(params.r) ||
      !Number.isInteger(params.p) ||
      expected.length !== KEY_LENGTH
    ) {
      return false;
    }

    const actual = await scrypt(
      normalizedPassword(password),
      salt,
      expected.length,
      params
    );

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export const passwordPolicy = Object.freeze({
  minLength: 12,
  maxLength: 128
});

export const passwordInternals = {
  KEY_LENGTH,
  PARAMS,
  SCHEME
};
