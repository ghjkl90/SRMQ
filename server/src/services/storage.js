// src/services/storage.js
// 업로드 이미지 저장: 원본은 최대 2000px JPEG, 목록용 썸네일은 800px JPEG 로 저장합니다.
// (휴대폰 사진의 GPS 등 메타데이터는 자동으로 제거됩니다)
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { badRequest } from '../lib/errors.js';

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function createStorage({ dir, publicBase }) {
  const absolute = (key) => {
    const resolved = path.resolve(dir, key);
    if (!resolved.startsWith(path.resolve(dir) + path.sep)) throw new Error('잘못된 파일 경로');
    return resolved;
  };

  async function saveGalleryImage(buffer, mimetype) {
    if (!ACCEPTED.has(mimetype)) throw badRequest('JPG, PNG, WEBP 이미지만 올릴 수 있습니다.');

    let image;
    try {
      image = sharp(buffer, { failOn: 'error' }).rotate(); // EXIF 방향대로 회전
      await image.metadata();
    } catch {
      throw badRequest('이미지 파일을 읽을 수 없습니다.');
    }

    const now = new Date();
    const folder = `gallery/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const id = randomBytes(9).toString('base64url');
    const key = `${folder}/${id}.jpg`;
    const thumbKey = `${folder}/${id}_thumb.jpg`;

    const full = await image
      .clone()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    const thumb = await image
      .clone()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    await mkdir(path.dirname(absolute(key)), { recursive: true });
    await writeFile(absolute(key), full.data);
    await writeFile(absolute(thumbKey), thumb);

    return {
      key,
      thumbKey,
      width: full.info.width,
      height: full.info.height,
      sizeBytes: full.data.length,
    };
  }

  async function remove(keys) {
    for (const key of keys.filter(Boolean)) {
      await rm(absolute(key), { force: true }).catch(() => {});
    }
  }

  const url = (key) => (key ? `${publicBase}/${key}` : null);

  return { saveGalleryImage, remove, url, dir };
}
