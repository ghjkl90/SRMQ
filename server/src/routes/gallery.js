// src/routes/gallery.js
//  공개:   GET  /api/gallery
//  관리자: /api/admin/gallery/albums (CRUD) · POST /api/admin/uploads (이미지 업로드)
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { badRequest } from '../lib/errors.js';
import { idParam, parse } from '../lib/validation.js';
import { deleteAlbum, getAlbum, listAlbums, saveAlbum } from '../services/gallery.js';

const albumSchema = z.object({
  year: z.coerce.number().int().min(1990, '연도를 확인해 주세요.').max(2100, '연도를 확인해 주세요.'),
  title: z.string().trim().min(1, '앨범 제목을 입력해 주세요.').max(120, '제목은 120자 이하로 입력해 주세요.'),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
  sections: z
    .array(
      z.object({
        title: z.string().trim().max(120, '소제목은 120자 이하로 입력해 주세요.').optional().nullable(),
        photos: z
          .array(
            z.object({
              imageKey: z.string().regex(/^gallery\/[\w/-]+\.jpg$/, '잘못된 이미지입니다.'),
              caption: z.string().trim().max(300, '사진 설명은 300자 이하로 입력해 주세요.').optional().default(''),
            }),
          )
          .max(200, '한 섹션에는 사진을 200장까지 올릴 수 있습니다.'),
      }),
    )
    .min(1, '섹션이 하나 이상 필요합니다.')
    .max(30, '섹션은 30개까지 만들 수 있습니다.'),
});

export function galleryPublicRoutes({ db, storage }) {
  const router = Router();
  router.get('/', async (req, res) => {
    const includeDrafts = req.query.drafts === '1' && req.user?.role === 'ADMIN';
    res.json({ albums: await listAlbums(db, storage, { includeDrafts }) });
  });
  return router;
}

export function galleryAdminRoutes({ db, storage, config }) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.uploads.maxFileMb * 1024 * 1024, files: 1 },
  });

  router.post('/uploads', upload.single('file'), async (req, res) => {
    if (!req.file) throw badRequest('파일을 선택해 주세요.');
    const saved = await storage.saveGalleryImage(req.file.buffer, req.file.mimetype);
    await db.query(
      `INSERT INTO uploads (key, thumb_key, width, height, size_bytes, original_name, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [saved.key, saved.thumbKey, saved.width, saved.height, saved.sizeBytes, req.file.originalname?.slice(0, 200), req.user.id],
    );
    res.status(201).json({
      imageKey: saved.key,
      url: storage.url(saved.key),
      thumbUrl: storage.url(saved.thumbKey),
      width: saved.width,
      height: saved.height,
    });
  });

  router.get('/gallery/albums/:id', async (req, res) => {
    res.json({ album: await getAlbum(db, storage, parse(idParam, req.params.id)) });
  });

  router.post('/gallery/albums', async (req, res) => {
    const data = parse(albumSchema, req.body);
    const id = await saveAlbum(db, { data, userId: req.user.id });
    res.status(201).json({ album: await getAlbum(db, storage, id) });
  });

  router.put('/gallery/albums/:id', async (req, res) => {
    const albumId = parse(idParam, req.params.id);
    const data = parse(albumSchema, req.body);
    await saveAlbum(db, { albumId, data, userId: req.user.id });
    res.json({ album: await getAlbum(db, storage, albumId) });
  });

  router.delete('/gallery/albums/:id', async (req, res) => {
    await deleteAlbum(db, parse(idParam, req.params.id));
    res.json({ ok: true });
  });

  return router;
}
