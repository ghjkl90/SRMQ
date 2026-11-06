// src/app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpError } from './lib/errors.js';
import { loadSession, requireAdmin } from './middleware/auth.js';
import { cors, createLimits, errorHandler, originGuard, requestLogger } from './middleware/http.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import planRoutes from './routes/plans.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import { galleryAdminRoutes, galleryPublicRoutes } from './routes/gallery.js';

function parseTrustProxy(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(String(value))) return Number(value);
  return value;
}

export function createApp({ config, db, toss, mailer, storage, rateLimit = true, logRequests = true }) {
  const app = express();
  const deps = { config, db, toss, mailer, storage, limits: createLimits({ enabled: rateLimit }) };

  app.set('trust proxy', parseTrustProxy(config.trustProxy));
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  if (logRequests) app.use(requestLogger());
  app.use(cors(config.allowedOrigins));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', originGuard(config.allowedOrigins, { exempt: ['/payments/toss/webhook'] }));
  app.use('/api', loadSession({ db, config }));
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ ok: true, time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes(deps));
  app.use('/api/me', meRoutes(deps));
  app.use('/api/plans', planRoutes(deps));
  app.use('/api/orders', orderRoutes(deps));
  app.use('/api/payments', paymentRoutes(deps));
  app.use('/api/gallery', galleryPublicRoutes(deps));
  app.use('/api/admin', requireAdmin, adminRoutes(deps), galleryAdminRoutes(deps));

  // 업로드 이미지 (운영에서는 Caddy 가 직접 제공하지만, 개발 · 단독 실행을 위해 API 에서도 제공)
  app.use(
    config.uploads.publicBase,
    express.static(config.uploads.dir, { maxAge: '30d', immutable: true, index: false, fallthrough: false }),
  );

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', '요청한 API가 없습니다.')));
  app.use(errorHandler(config));
  return app;
}
