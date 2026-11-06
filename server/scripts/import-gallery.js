// scripts/import-gallery.js — 기존 포상갤러리 사진(프론트 src/assets/award-gallery)을 DB · 업로드 폴더로 옮깁니다.
//
//   (server 폴더에서)  npm run import-gallery -- --images ../src/assets/award-gallery
//
// - 사진 목록과 캡션은 scripts/award-gallery-seed.json (기존 AwardGalleryPage.jsx 의 GALLERY 데이터)에서 읽습니다.
// - 같은 연도 · 제목의 앨범이 이미 있으면 건너뜁니다. (--force 를 주면 그 앨범의 사진을 다시 넣습니다)
// - 사진은 최대 2000px · 썸네일 800px JPEG 로 변환되어 저장됩니다.
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { createStorage } from '../src/services/storage.js';
import { saveAlbum } from '../src/services/gallery.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, []),
);

const here = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = args.images && path.resolve(args.images);
const dataFile = path.resolve(args.data || path.join(here, 'award-gallery-seed.json'));
if (!imagesDir) {
  console.error('사용법: npm run import-gallery -- --images /경로/src/assets/award-gallery [--force]');
  process.exit(1);
}

const isDir = await stat(imagesDir).then((s) => s.isDirectory(), () => false);
if (!isDir) {
  console.error(`사진 폴더를 찾을 수 없습니다: ${imagesDir}`);
  console.error('server 폴더에서 실행했는지, 경로가 맞는지 확인하세요. (기본: ../src/assets/award-gallery)');
  process.exit(1);
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const config = loadConfig();
const db = createDb(config.databaseUrl);
const storage = createStorage(config.uploads);

try {
  await runMigrations(db, { log: () => {} });
  const gallery = JSON.parse(await readFile(dataFile, 'utf8'));
  const admin = (await db.query(`SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1`)).rows[0];

  for (const [index, entry] of gallery.entries()) {
    const exists = await db.query('SELECT id FROM gallery_albums WHERE year = $1 AND title = $2 ORDER BY id LIMIT 1', [entry.year, entry.title]);
    const existingId = exists.rows[0]?.id ?? null;
    if (existingId && args.force !== 'true') {
      console.log(`- 건너뜀: ${entry.year} ${entry.title} (이미 있음)`);
      continue;
    }

    const sections = [];
    let count = 0;
    for (const section of entry.sections) {
      const photos = [];
      for (const photo of section.photos) {
        const file = path.join(imagesDir, String(entry.year), photo.file);
        let buffer;
        try {
          buffer = await readFile(file);
        } catch {
          console.warn(`  ! 파일 없음: ${file}`);
          continue;
        }
        const saved = await storage.saveGalleryImage(buffer, MIME[path.extname(file).toLowerCase()] || 'image/jpeg');
        await db.query(
          `INSERT INTO uploads (key, thumb_key, width, height, size_bytes, original_name, attached, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
          [saved.key, saved.thumbKey, saved.width, saved.height, saved.sizeBytes, photo.file, admin?.id ?? null],
        );
        photos.push({ imageKey: saved.key, caption: (photo.caption || '').trim() });
        count += 1;
      }
      sections.push({ title: section.title, photos });
    }

    if (count === 0) {
      console.warn(`! ${entry.year} ${entry.title}: 찾은 사진이 없어 앨범을 만들지 않았습니다`);
      continue;
    }

    // --force 일 때는 같은 앨범을 새로 만들지 않고 내용을 바꿉니다(중복 방지).
    await saveAlbum(db, {
      albumId: existingId,
      data: { year: entry.year, title: entry.title, isPublished: true, sortOrder: index, sections },
      userId: admin?.id ?? null,
    });
    console.log(`✓ ${entry.year} ${entry.title} — 사진 ${count}장${existingId ? ' (다시 만듦)' : ''}`);
  }
  console.log('[import-gallery] 완료');
} finally {
  await db.end();
}
