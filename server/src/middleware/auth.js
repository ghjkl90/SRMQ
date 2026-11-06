// src/middleware/auth.js
// 로그인 세션: httpOnly 쿠키에 서명된 토큰(JWT)을 넣습니다. 자바스크립트에서 읽을 수 없어 XSS 에 안전합니다.
// 비밀번호 변경 · 탈퇴 시 token_version 을 올려 기존 로그인을 모두 무효화합니다.
import { forbidden, unauthorized } from '../lib/errors.js';
import { signSession, verifySession } from '../lib/security.js';

function cookieOptions(config, maxAgeMs) {
  const { secure, sameSite, domain } = config.session;
  return {
    httpOnly: true,
    secure: sameSite === 'none' ? true : secure,
    sameSite,
    domain,
    path: '/',
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

export function issueSession(res, config, user, { remember = false } = {}) {
  const seconds = remember ? config.session.rememberDays * 86_400 : config.session.ttlHours * 3_600;
  const token = signSession(user, config.jwtSecret, seconds);
  // '로그인 유지'를 고르지 않으면 브라우저를 닫을 때 쿠키가 지워지는 세션 쿠키로 발급합니다.
  res.cookie(config.session.cookieName, token, cookieOptions(config, remember ? seconds * 1000 : undefined));
}

export function clearSession(res, config) {
  res.clearCookie(config.session.cookieName, cookieOptions(config));
}

/** 쿠키가 있으면 회원을 불러와 req.user 에 넣습니다. (없으면 그냥 통과) */
export function loadSession({ db, config }) {
  return async (req, res, next) => {
    const token = req.cookies?.[config.session.cookieName];
    if (!token) return next();
    try {
      const payload = verifySession(token, config.jwtSecret);
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [Number(payload.sub)]);
      const user = rows[0];
      if (user && user.status === 'ACTIVE' && user.token_version === payload.tv) {
        req.user = user;
      } else {
        clearSession(res, config);
      }
    } catch {
      clearSession(res, config);
    }
    return next();
  };
}

export const requireAuth = (req, _res, next) => (req.user ? next() : next(unauthorized()));

export const requireAdmin = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'ADMIN') return next(forbidden('관리자만 이용할 수 있습니다.'));
  return next();
};
