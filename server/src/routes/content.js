// src/routes/content.js — 홈페이지 콘텐츠
//  공개:   GET /api/home-slides · GET /api/best-companies
//  관리자: PUT /api/admin/home-slides · PUT /api/admin/best-companies
//  (사진 업로드는 포상갤러리와 같은 POST /api/admin/uploads 를 씁니다)
import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../lib/validation.js';
import { getBestCompanies, listHomeSlides, saveBestCompanies, saveHomeSlides } from '../services/content.js';

// 사이트 안 주소(/award-gallery?year=2025) 또는 http(s):// 주소만 허용
const linkSchema = z
  .string()
  .trim()
  .max(500, '링크는 500자 이하로 입력해 주세요.')
  .refine((v) => v === '' || /^\/(?!\/)\S*$/.test(v) || /^https?:\/\/\S+$/i.test(v), {
    message: '링크는 / 로 시작하는 사이트 주소나 https:// 로 시작하는 주소로 입력해 주세요.',
  })
  .optional()
  .nullable();

const slidesSchema = z.object({
  slides: z
    .array(
      z.object({
        imageKey: z.string().regex(/^gallery\/[\w/-]+\.jpg$/, '잘못된 이미지입니다.'),
        caption: z.string().trim().max(200, '슬라이드 문구는 200자 이하로 입력해 주세요.').optional().default(''),
        linkUrl: linkSchema,
      }),
    )
    .max(30, '슬라이드는 30장까지 등록할 수 있습니다.'),
});

const bestSchema = z.object({
  title: z.string().trim().max(60, '제목은 60자 이하로 입력해 주세요.').optional().default(''),
  basis: z.string().trim().max(200, '평가 기준은 200자 이하로 입력해 주세요.').optional().default(''),
  unit: z.string().trim().max(10, '단위는 10자 이하로 입력해 주세요.').optional().default('점'),
  companies: z
    .array(
      z.object({
        name: z.string().trim().min(1, '기업명을 입력해 주세요.').max(80, '기업명은 80자 이하로 입력해 주세요.'),
        category: z.string().trim().max(60, '구분은 60자 이하로 입력해 주세요.').optional().default(''),
        score: z
          .number({ error: '점수를 숫자로 입력해 주세요.' })
          .finite('점수를 숫자로 입력해 주세요.')
          .min(0, '점수는 0 이상이어야 합니다.')
          .max(999_999_999, '점수가 너무 큽니다.'),
      }),
    )
    .max(200, '기업은 200곳까지 등록할 수 있습니다.')
    .refine((list) => new Set(list.map((c) => c.name)).size === list.length, {
      message: '같은 기업명이 두 번 들어 있습니다.',
    }),
});

export function contentPublicRoutes({ db, storage }) {
  const router = Router();
  router.get('/home-slides', async (_req, res) => {
    res.json({ slides: await listHomeSlides(db, storage) });
  });
  router.get('/best-companies', async (_req, res) => {
    res.json(await getBestCompanies(db));
  });
  return router;
}

export function contentAdminRoutes({ db, storage }) {
  const router = Router();
  router.put('/home-slides', async (req, res) => {
    const { slides } = parse(slidesSchema, req.body);
    await saveHomeSlides(db, { slides, userId: req.user.id });
    res.json({ slides: await listHomeSlides(db, storage) });
  });
  router.put('/best-companies', async (req, res) => {
    const data = parse(bestSchema, req.body);
    res.json(await saveBestCompanies(db, { data, userId: req.user.id }));
  });
  return router;
}
