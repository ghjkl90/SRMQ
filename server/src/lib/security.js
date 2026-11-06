// src/lib/security.js
// 비밀번호 해시(scrypt, Node 내장) · 세션 토큰(JWT) · 임의 토큰 생성
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';

const scryptAsync = promisify(scrypt);
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: SCRYPT.maxmem,
  });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const [, n, r, p, saltB64, keyB64] = stored.split('$');
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const sha256 = (value) => createHash('sha256').update(String(value)).digest('hex');

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

/** 토스페이먼츠 customerKey (22~50자, 영문·숫자·-_=.@) */
export const newCustomerKey = () => `srmq_${randomUUID().replace(/-/g, '')}`;

/** 토스페이먼츠 orderId (6~64자, 영문·숫자·-_=) 예: SRMQ-20261102-K3F9Q2ZD7M */
export function newOrderNo(date = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(10);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `SRMQ-${ymd}-${suffix}`;
}

export function signSession(user, secret, expiresInSeconds) {
  return jwt.sign({ sub: String(user.id), tv: user.token_version }, secret, {
    expiresIn: expiresInSeconds,
    issuer: 'srmq-api',
  });
}

export function verifySession(token, secret) {
  return jwt.verify(token, secret, { issuer: 'srmq-api' });
}
