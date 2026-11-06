// src/middleware/http.js
import { rateLimit } from 'express-rate-limit';
import { HttpError } from '../lib/errors.js';

/**
 * CORS: 프론트와 API 주소가 다를 때(예: Vercel + api.srmq.or.kr)만 필요합니다.
 * 같은 주소(/api)로 운영하면 브라우저가 CORS 요청을 보내지 않습니다.
 */
export function cors(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '600');
        return res.status(204).end();
      }
    }
    return next();
  };
}

/**
 * CSRF 방어: 브라우저는 다른 사이트에서 보낸 POST 요청에 반드시 Origin 헤더를 붙입니다.
 * 허용하지 않은 Origin 의 변경 요청(POST/PUT/PATCH/DELETE)은 거절합니다.
 * (SameSite=Lax 쿠키와 함께 이중으로 막습니다. 토스 웹훅은 서버→서버 호출이라 예외)
 */
export function originGuard(allowedOrigins, { exempt = [] } = {}) {
  const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
  return (req, _res, next) => {
    if (SAFE.has(req.method) || exempt.some((p) => req.path.startsWith(p))) return next();
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      return next(new HttpError(403, 'BAD_ORIGIN', '허용되지 않은 출처의 요청입니다.'));
    }
    return next();
  };
}

const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new HttpError(429, 'TOO_MANY_REQUESTS', message)),
  });

export function createLimits({ enabled = true } = {}) {
  const pass = (_req, _res, next) => next();
  if (!enabled) return { login: pass, signup: pass, emailCheck: pass, passwordReset: pass, sensitive: pass };
  return {
    login: limiter(15, 20, '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.'),
    signup: limiter(60, 10, '가입 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'),
    emailCheck: limiter(1, 30, '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'),
    passwordReset: limiter(15, 5, '요청이 너무 많습니다. 15분 후 다시 시도해 주세요.'),
    sensitive: limiter(15, 10, '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'),
  };
}

export function errorHandler({ isProd }) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'BAD_JSON', message: '요청 형식이 올바르지 않습니다.' } });
    }
    if (err?.name === 'MulterError') {
      const message = err.code === 'LIMIT_FILE_SIZE' ? '파일 용량이 너무 큽니다.' : '파일 업로드 오류입니다.';
      return res.status(400).json({ error: { code: err.code, message } });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, fields: err.fields, ...(err.extra || {}) },
      });
    }
    if (err?.code === '23505') {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: '이미 등록된 값입니다.' } });
    }
    const status = err?.status || err?.statusCode;
    if (status >= 400 && status < 500) {
      return res.status(status).json({ error: { code: `HTTP_${status}`, message: status === 404 ? '찾을 수 없습니다.' : '잘못된 요청입니다.' } });
    }
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', ...(isProd ? {} : { detail: err?.message }) },
    });
  };
}

export function requestLogger() {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    const path = req.originalUrl.split('?')[0]; // 쿼리(토큰 등)는 로그에 남기지 않음
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      console.log(`${new Date().toISOString()} ${req.method} ${path} ${res.statusCode} ${ms.toFixed(0)}ms`);
    });
    next();
  };
}
