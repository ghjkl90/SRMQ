// src/services/gallery.js
// 포상갤러리: 앨범(연도 · 제목 · 공개여부) → 섹션(소제목) → 사진(캡션)
import { badRequest, notFound } from '../lib/errors.js';

function assemble(albums, sections, photos, storage) {
  const photosBySection = new Map();
  for (const p of photos) {
    if (!photosBySection.has(p.section_id)) photosBySection.set(p.section_id, []);
    photosBySection.get(p.section_id).push({
      id: p.id,
      imageKey: p.image_key,
      url: storage.url(p.image_key),
      thumbUrl: storage.url(p.thumb_key),
      width: p.width,
      height: p.height,
      caption: p.caption,
    });
  }
  const sectionsByAlbum = new Map();
  for (const s of sections) {
    if (!sectionsByAlbum.has(s.album_id)) sectionsByAlbum.set(s.album_id, []);
    sectionsByAlbum.get(s.album_id).push({ id: s.id, title: s.title, photos: photosBySection.get(s.id) ?? [] });
  }
  return albums.map((a) => ({
    id: a.id,
    year: a.year,
    title: a.title,
    isPublished: a.is_published,
    sortOrder: a.sort_order,
    updatedAt: a.updated_at,
    sections: sectionsByAlbum.get(a.id) ?? [],
  }));
}

async function loadAlbums(q, storage, where, params) {
  const albums = await q.query(
    `SELECT * FROM gallery_albums ${where} ORDER BY year DESC, sort_order, id`,
    params,
  );
  if (!albums.rows.length) return [];
  const albumIds = albums.rows.map((a) => a.id);
  const sections = await q.query(
    'SELECT * FROM gallery_sections WHERE album_id = ANY($1) ORDER BY sort_order, id',
    [albumIds],
  );
  const sectionIds = sections.rows.map((s) => s.id);
  const photos = sectionIds.length
    ? await q.query(
        `SELECT p.*, u.thumb_key, u.width, u.height
           FROM gallery_photos p JOIN uploads u ON u.key = p.image_key
          WHERE p.section_id = ANY($1)
          ORDER BY p.sort_order, p.id`,
        [sectionIds],
      )
    : { rows: [] };
  return assemble(albums.rows, sections.rows, photos.rows, storage);
}

export function listAlbums(db, storage, { includeDrafts = false } = {}) {
  return loadAlbums(db, storage, includeDrafts ? '' : 'WHERE is_published', []);
}

export async function getAlbum(db, storage, id) {
  const [album] = await loadAlbums(db, storage, 'WHERE id = $1', [id]);
  if (!album) throw notFound('앨범을 찾을 수 없습니다.');
  return album;
}

async function albumImageKeys(client, albumId) {
  const { rows } = await client.query(
    `SELECT p.image_key FROM gallery_photos p
       JOIN gallery_sections s ON s.id = p.section_id
      WHERE s.album_id = $1`,
    [albumId],
  );
  return rows.map((r) => r.image_key);
}

async function detachUnused(client, keys) {
  if (!keys.length) return;
  await client.query(
    `UPDATE uploads SET attached = false, detached_at = now()
      WHERE key = ANY($1) AND key NOT IN (SELECT image_key FROM gallery_photos)`,
    [keys],
  );
}

/**
 * 앨범 저장 (새로 만들기 / 수정 공통). 섹션과 사진은 화면에서 보낸 순서대로 다시 씁니다.
 * data: { year, title, isPublished, sortOrder, sections: [{ title, photos: [{ imageKey, caption }] }] }
 */
export async function saveAlbum(db, { albumId = null, data, userId }) {
  return db.tx(async (client) => {
    const keys = data.sections.flatMap((s) => s.photos.map((p) => p.imageKey));
    if (keys.length) {
      const { rows } = await client.query('SELECT key FROM uploads WHERE key = ANY($1)', [keys]);
      if (rows.length !== new Set(keys).size) {
        throw badRequest('업로드가 완료되지 않은 사진이 있습니다. 해당 사진을 다시 올려 주세요.');
      }
    }

    let id = albumId;
    let previousKeys = [];
    if (id) {
      const existing = await client.query('SELECT id FROM gallery_albums WHERE id = $1 FOR UPDATE', [id]);
      if (!existing.rowCount) throw notFound('앨범을 찾을 수 없습니다.');
      previousKeys = await albumImageKeys(client, id);
      await client.query(
        `UPDATE gallery_albums
            SET year = $2, title = $3, is_published = $4, sort_order = $5, updated_by = $6, updated_at = now()
          WHERE id = $1`,
        [id, data.year, data.title, data.isPublished, data.sortOrder ?? 0, userId],
      );
      await client.query('DELETE FROM gallery_sections WHERE album_id = $1', [id]);
    } else {
      const inserted = await client.query(
        `INSERT INTO gallery_albums (year, title, is_published, sort_order, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
        [data.year, data.title, data.isPublished, data.sortOrder ?? 0, userId],
      );
      id = inserted.rows[0].id;
    }

    for (const [sIndex, section] of data.sections.entries()) {
      const s = await client.query(
        'INSERT INTO gallery_sections (album_id, title, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [id, section.title || null, sIndex],
      );
      for (const [pIndex, photo] of section.photos.entries()) {
        await client.query(
          'INSERT INTO gallery_photos (section_id, image_key, caption, sort_order) VALUES ($1, $2, $3, $4)',
          [s.rows[0].id, photo.imageKey, photo.caption || '', pIndex],
        );
      }
    }

    if (keys.length) {
      await client.query('UPDATE uploads SET attached = true, detached_at = NULL WHERE key = ANY($1)', [keys]);
    }
    await detachUnused(client, previousKeys.filter((k) => !keys.includes(k)));
    return id;
  });
}

export async function deleteAlbum(db, albumId) {
  return db.tx(async (client) => {
    const keys = await albumImageKeys(client, albumId);
    const deleted = await client.query('DELETE FROM gallery_albums WHERE id = $1', [albumId]);
    if (!deleted.rowCount) throw notFound('앨범을 찾을 수 없습니다.');
    await detachUnused(client, keys);
  });
}

/** 스케줄러: 갤러리에 연결되지 않은 지 24시간이 지난 업로드 파일 삭제 */
export async function cleanupUploads(db, storage) {
  const { rows } = await db.query(
    `SELECT id, key, thumb_key FROM uploads
      WHERE attached = false
        AND COALESCE(detached_at, created_at) < now() - interval '24 hours'
        AND key NOT IN (SELECT image_key FROM gallery_photos)
      LIMIT 500`,
  );
  for (const row of rows) {
    await storage.remove([row.key, row.thumb_key]);
    await db.query('DELETE FROM uploads WHERE id = $1', [row.id]);
  }
  return rows.length;
}
