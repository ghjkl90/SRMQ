// src/components/pages/AwardGalleryPage.jsx
// 포상 및 활동 갤러리. 사진은 서버(DB)에서 불러오고, 관리자로 로그인하면 등록 · 수정 버튼이 보입니다.
// 서버에 연결할 수 없거나 아직 사진을 서버로 옮기기 전이면 기존 사진(src/assets/award-gallery)을 보여 줍니다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, assetUrl } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { AWARD_GALLERY_STATIC } from '../../data/awardGalleryStatic';
import { Badge, ButtonLink } from '../member/MemberUI';
import { EditIcon, PlusIcon } from '../member/icons';
import './SubpageLayout.css';
import './AwardGalleryPage.css';

// 서버 이전이 끝나고 기존 사진 폴더를 지우려면 false 로 바꾸고, 아래 IMAGES · AWARD_GALLERY_STATIC import 를 지우세요.
const STATIC_FALLBACK = true;

const IMAGES = import.meta.glob('../../assets/award-gallery/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});
const staticSrc = (year, file) => IMAGES[`../../assets/award-gallery/${year}/${file}`];

// 기존 데이터를 서버 응답과 같은 모양으로 맞춥니다.
const STATIC_ALBUMS = STATIC_FALLBACK
  ? AWARD_GALLERY_STATIC.map((entry, i) => ({
      id: `static-${i}`,
      year: entry.year,
      title: entry.title,
      isPublished: true,
      sections: entry.sections.map((section, j) => ({
        id: `static-${i}-${j}`,
        title: section.title,
        photos: section.photos.map((p) => ({
          id: `${entry.year}/${p.file}`,
          url: staticSrc(entry.year, p.file),
          thumbUrl: null,
          caption: p.caption,
        })),
      })),
    }))
  : [];

const countPhotos = (albums) =>
  albums.reduce((sum, a) => sum + a.sections.reduce((s, sec) => s + sec.photos.length, 0), 0);

function GalleryPhoto({ photo }) {
  const full = assetUrl(photo.url);
  const thumb = photo.thumbUrl ? assetUrl(photo.thumbUrl) : null;
  return (
    <figure className="award-gallery-item">
      <img
        src={thumb || full}
        srcSet={thumb ? `${thumb} 800w, ${full} 2000w` : undefined}
        sizes={thumb ? '(max-width: 768px) 100vw, (max-width: 1400px) 33vw, 420px' : undefined}
        alt={photo.caption?.trim() || '포상 및 활동 사진'}
        loading="lazy"
        decoding="async"
      />
      {photo.caption?.trim() && <figcaption>{photo.caption}</figcaption>}
    </figure>
  );
}

const AwardGalleryPage = () => {
  const { isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabRefs = useRef({});
  const [data, setData] = useState({ loading: true, albums: [], source: 'api' });

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/gallery${isAdmin ? '?drafts=1' : ''}`)
      .then(({ albums }) => {
        if (!alive) return;
        if (albums.length || !STATIC_FALLBACK) setData({ loading: false, albums, source: 'api' });
        else setData({ loading: false, albums: STATIC_ALBUMS, source: 'static' });
      })
      .catch(() => alive && setData({ loading: false, albums: STATIC_ALBUMS, source: 'static' }));
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  const years = useMemo(() => [...new Set(data.albums.map((a) => a.year))].sort((a, b) => b - a), [data.albums]);
  const defaultYear =
    years.find((y) => countPhotos(data.albums.filter((a) => a.year === y)) > 0) ?? years[0];
  const requested = Number(params.get('year'));
  const selectedYear = years.includes(requested) ? requested : defaultYear;
  const albums = data.albums.filter((a) => a.year === selectedYear);
  const total = countPhotos(albums);
  const canEdit = isAdmin && data.source === 'api';

  const selectYear = (year) => setParams({ year: String(year) }, { replace: true });

  // 좌우 화살표 키로 연도 탭 이동
  const handleTabKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step || !years.length) return;
    event.preventDefault();
    const index = years.indexOf(selectedYear);
    const nextYear = years[(index + step + years.length) % years.length];
    selectYear(nextYear);
    tabRefs.current[nextYear]?.focus();
  };

  return (
    <div className="subpage-container">
      <div className="subpage-content">
        {/* 페이지 헤더 */}
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">포상갤러리</span>
            <span className="subpage-badge-en">AWARDS &amp; EVENTS</span>
          </div>
          <h1 className="subpage-title">포상 및 활동 갤러리</h1>
          <p className="subpage-desc">
            사단법인 사회적책임경영품질원의 국가경영대상/SRMQ상 시상식과 컨벤션 현장을 사진으로
            전해드립니다.
          </p>
        </header>

        {/* 관리자 도구 */}
        {isAdmin && !data.loading && (
          <div className="ms-admin-bar">
            <span>
              <strong>관리자 모드</strong> ·{' '}
              {canEdit
                ? '앨범을 새로 등록하거나 각 앨범의 수정 버튼으로 사진 · 캡션을 바꿀 수 있습니다.'
                : '기존 사진이 아직 서버로 옮겨지지 않았습니다. (서버에서 npm run import-gallery 실행) 새 앨범 등록은 바로 가능합니다.'}
            </span>
            <ButtonLink to={`/award-gallery/new${selectedYear ? `?year=${selectedYear}` : ''}`} size="sm" icon={<PlusIcon size={15} />}>
              새 앨범 등록
            </ButtonLink>
          </div>
        )}

        {/* 연도 탭 */}
        <div className="award-gallery-toolbar">
          <div className="award-gallery-tabs" role="tablist" aria-label="연도 선택" onKeyDown={handleTabKeyDown}>
            {years.map((year) => {
              const isActive = year === selectedYear;
              return (
                <button
                  key={year}
                  ref={(el) => {
                    tabRefs.current[year] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`award-gallery-tab-${year}`}
                  aria-selected={isActive}
                  aria-controls="award-gallery-panel"
                  tabIndex={isActive ? 0 : -1}
                  className={`award-gallery-tab${isActive ? ' is-active' : ''}`}
                  onClick={() => selectYear(year)}
                >
                  {year}년
                </button>
              );
            })}
          </div>
          <p className="award-gallery-total">
            Total <strong>{total}</strong>
          </p>
        </div>

        {/* 선택한 연도의 사진 */}
        <section
          key={selectedYear}
          id="award-gallery-panel"
          className="award-gallery-panel"
          role="tabpanel"
          aria-labelledby={selectedYear ? `award-gallery-tab-${selectedYear}` : undefined}
        >
          {data.loading ? (
            <div className="ms-loading"><span className="ms-spinner" aria-hidden="true" /> 사진을 불러오는 중입니다</div>
          ) : !years.length ? (
            <p className="award-gallery-empty">등록된 사진이 없습니다.</p>
          ) : (
            albums.map((album) => {
              const photoCount = album.sections.reduce((s, sec) => s + sec.photos.length, 0);
              return (
                <article className="award-gallery-album" key={album.id}>
                  <div className="award-gallery-album-head">
                    <h2 className="award-gallery-year-title">{album.title}</h2>
                    {canEdit && (
                      <>
                        {!album.isPublished && <Badge tone="slate">비공개 (임시저장)</Badge>}
                        <ButtonLink to={`/award-gallery/${album.id}/edit`} variant="outline" size="xs" icon={<EditIcon size={13} />}>
                          수정
                        </ButtonLink>
                      </>
                    )}
                  </div>
                  {photoCount === 0 ? (
                    <p className="award-gallery-empty">{album.year}년 사진은 준비 중입니다.</p>
                  ) : (
                    <div className="award-gallery-sections">
                      {album.sections.map((section) =>
                        section.photos.length ? (
                          <div className="award-gallery-section" key={section.id}>
                            {section.title && <h3 className="award-gallery-section-title">{section.title}</h3>}
                            <ul className="award-gallery-grid">
                              {section.photos.map((photo) => (
                                <li key={photo.id}>
                                  <GalleryPhoto photo={photo} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null,
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* 최하단 바 */}
      <footer className="subpage-bottom-bar">
        <span>© National Awards & Quality Management Convention. All rights reserved.</span>
        <span>Awards &amp; Events Gallery</span>
      </footer>
    </div>
  );
};

export default AwardGalleryPage;
