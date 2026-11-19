// src/services/content.js
// 홈페이지 콘텐츠: 메인 화면 슬라이드 · 베스트 기업 순위
import { assertUploaded, detachUnused } from './gallery.js';

/* ------------------------------------------------------------------ */
/* 메인 화면 슬라이드                                                    */
/* ------------------------------------------------------------------ */

export async function listHomeSlides(db, storage) {
  const { rows } = await db.query(
    `SELECT s.id, s.image_key, s.caption, s.link_url, u.thumb_key, u.width, u.height
       FROM home_slides s JOIN uploads u ON u.key = s.image_key
      ORDER BY s.sort_order, s.id`,
  );
  return rows.map((r) => ({
    id: r.id,
    imageKey: r.image_key,
    url: storage.url(r.image_key),
    thumbUrl: storage.url(r.thumb_key),
    width: r.width,
    height: r.height,
    caption: r.caption,
    linkUrl: r.link_url,
  }));
}

/**
 * 슬라이드 전체를 화면에서 보낸 순서대로 다시 씁니다.
 * slides: [{ imageKey, caption, linkUrl }]
 */
export async function saveHomeSlides(db, { slides, userId }) {
  return db.tx(async (client) => {
    // 관리자 두 명이 동시에 저장해도 순서가 섞이지 않도록
    await client.query('LOCK TABLE home_slides IN EXCLUSIVE MODE');
    const keys = slides.map((s) => s.imageKey);
    await assertUploaded(client, keys);

    const previous = (await client.query('SELECT image_key FROM home_slides')).rows.map((r) => r.image_key);
    await client.query('DELETE FROM home_slides');
    for (const [index, slide] of slides.entries()) {
      await client.query(
        `INSERT INTO home_slides (image_key, caption, link_url, sort_order, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [slide.imageKey, slide.caption || '', slide.linkUrl || null, index, userId],
      );
    }

    if (keys.length) {
      await client.query('UPDATE uploads SET attached = true, detached_at = NULL WHERE key = ANY($1)', [keys]);
    }
    await detachUnused(client, previous.filter((k) => !keys.includes(k)));
  });
}

/* ------------------------------------------------------------------ */
/* 베스트 기업 순위                                                      */
/* ------------------------------------------------------------------ */

const BEST_SETTINGS_KEY = 'best_companies';
export const BEST_DEFAULTS = { title: '베스트 기업', basis: '', unit: '점' };

/** 점수 높은 순. 같은 점수는 관리자가 입력한 순서대로 */
export async function getBestCompanies(db) {
  const [list, setting] = await Promise.all([
    db.query('SELECT id, name, category, score, updated_at FROM best_companies ORDER BY score DESC, sort_order, id'),
    db.query('SELECT value, updated_at FROM site_settings WHERE key = $1', [BEST_SETTINGS_KEY]),
  ]);
  const saved = setting.rows[0];
  const updatedAt = saved?.updated_at ?? list.rows[0]?.updated_at ?? null;
  return {
    ...BEST_DEFAULTS,
    ...(saved?.value ?? {}),
    updatedAt,
    companies: list.rows.map((r) => ({ id: r.id, name: r.name, category: r.category, score: Number(r.score) })),
  };
}

/** data: { title, basis, unit, companies: [{ name, category, score }] } */
export async function saveBestCompanies(db, { data, userId }) {
  await db.tx(async (client) => {
    await client.query('LOCK TABLE best_companies IN EXCLUSIVE MODE');
    await client.query('DELETE FROM best_companies');
    for (const [index, c] of data.companies.entries()) {
      await client.query(
        `INSERT INTO best_companies (name, category, score, sort_order, updated_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [c.name, c.category || '', c.score, index, userId],
      );
    }
    const value = {
      title: data.title || BEST_DEFAULTS.title,
      basis: data.basis || '',
      unit: data.unit ?? BEST_DEFAULTS.unit,
    };
    await client.query(
      `INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [BEST_SETTINGS_KEY, JSON.stringify(value), userId],
    );
  });
  return getBestCompanies(db);
}
