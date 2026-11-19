// src/components/pages/ProgramPage.jsx — 첫 화면(도메인/)
// 사진 슬라이드는 관리자가 '메인 슬라이드 관리'(/admin/home-slides)에서 올리거나 포상갤러리에서 고른 사진을 보여 줍니다.
// 등록된 슬라이드가 없거나 서버에 연결할 수 없으면 기본 사진(assets/main_page*.png)을 보여 줍니다.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, assetUrl } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { ButtonLink } from '../member/MemberUI';
import { ArrowLeftIcon, ArrowRightIcon, SettingsIcon } from '../member/icons';
import './ProgramPage.css';

// assets 폴더의 기본 메인 사진
const images = import.meta.glob('../../assets/main_page*.png', { eager: true, import: 'default' });
const DEFAULT_FILES = ['main_page.png', 'main_page2.png', 'main_page3.png', 'main_page4.png'];
const DEFAULT_SLIDES = DEFAULT_FILES.map((file) => ({
  id: file,
  url: images[`../../assets/${file}`],
  thumbUrl: null,
  caption: '',
  linkUrl: null,
})).filter((s) => s.url);

const INTERVAL_MS = 5000;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function SlideLink({ to }) {
  const label = (
    <>
      자세히 보기 <ArrowRightIcon size={14} />
    </>
  );
  return /^https?:\/\//i.test(to) ? (
    <a className="program-slide-link" href={to} target="_blank" rel="noopener noreferrer">{label}</a>
  ) : (
    <Link className="program-slide-link" to={to}>{label}</Link>
  );
}

export default function ProgramPage() {
  const { isAdmin } = useAuth();
  const [slides, setSlides] = useState(null); // null = 불러오는 중
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [stopped, setStopped] = useState(prefersReducedMotion); // 정지 버튼 · 움직임 줄이기 설정
  const [rendered, setRendered] = useState(() => new Set([0, 1]));
  const touchX = useRef(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/api/home-slides')
      .then(({ slides: list }) => {
        if (!alive) return;
        // 서버 사진(/uploads/...)은 API 주소를 붙여서 씁니다.
        setSlides(list.length ? list.map((s) => ({ ...s, url: assetUrl(s.url), thumbUrl: assetUrl(s.thumbUrl) })) : DEFAULT_SLIDES);
      })
      .catch(() => alive && setSlides(DEFAULT_SLIDES));
    return () => {
      alive = false;
    };
  }, []);

  const count = slides?.length ?? 0;
  const go = useCallback((next) => setIndex(count ? (next + count) % count : 0), [count]);

  // 다음 사진으로 자동 이동 (마우스를 올리거나 정지하면 멈춤). 직접 넘기면 시간이 처음부터 다시 흐릅니다.
  useEffect(() => {
    if (count < 2 || hovering || stopped) return undefined;
    const timer = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [index, count, hovering, stopped, go]);

  // 지금 사진과 앞뒤 사진만 미리 불러옴 (사진이 많아도 첫 화면이 가볍도록)
  useEffect(() => {
    if (!count) return;
    setRendered((prev) => {
      const wanted = [index, (index + 1) % count, (index - 1 + count) % count];
      if (wanted.every((i) => prev.has(i))) return prev;
      return new Set([...prev, ...wanted]);
    });
  }, [index, count]);

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="program-container">
      {/* 상단 타이틀 */}
      <div className="program-header">
        <h1 className="program-title">사회적책임경영품질원</h1>
        <p className="program-subtitle">Social Responsibility &amp; Management Quality Institute</p>
        <p className="program-desc">
          기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
        </p>
      </div>

      {/* 사진 슬라이드 */}
      <section
        className={`program-slider${slides ? ' is-ready' : ''}`}
        aria-roledescription="carousel"
        aria-label="사경원 활동 사진"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHovering(false);
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides?.map((slide, i) => {
          const active = i === index;
          return (
            <figure
              key={slide.id}
              className={`program-slide${active ? ' is-active' : ''}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={!active}
            >
              {rendered.has(i) && (
                <img
                  src={slide.url}
                  srcSet={slide.thumbUrl ? `${slide.thumbUrl} 800w, ${slide.url} 2000w` : undefined}
                  sizes={slide.thumbUrl ? '(max-width: 768px) 100vw, 1400px' : undefined}
                  alt={slide.caption || '사회적책임경영품질원 활동 사진'}
                  decoding="async"
                />
              )}
              {(slide.caption || slide.linkUrl) && (
                <figcaption className="program-slide-caption">
                  {slide.caption && <p>{slide.caption}</p>}
                  {slide.linkUrl && active && <SlideLink to={slide.linkUrl} />}
                </figcaption>
              )}
            </figure>
          );
        })}

        {count > 1 && (
          <>
            <button type="button" className="program-arrow is-prev" onClick={() => go(index - 1)} aria-label="이전 사진">
              <ArrowLeftIcon size={20} />
            </button>
            <button type="button" className="program-arrow is-next" onClick={() => go(index + 1)} aria-label="다음 사진">
              <ArrowRightIcon size={20} />
            </button>

            <div className="program-controls">
              <div className="program-dots">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`${i + 1}번째 사진 보기`}
                    aria-current={i === index}
                    onClick={() => go(i)}
                    className={`program-dot${i === index ? ' is-active' : ''}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="program-pause"
                onClick={() => setStopped((v) => !v)}
                aria-label={stopped ? '자동 넘김 재생' : '자동 넘김 정지'}
                aria-pressed={stopped}
              >
                {stopped ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" fill="currentColor" /></svg>
                )}
              </button>
            </div>
          </>
        )}

        {isAdmin && (
          <ButtonLink to="/admin/home-slides" size="sm" variant="outline" icon={<SettingsIcon size={14} />} className="program-admin-btn">
            메인 슬라이드 관리
          </ButtonLink>
        )}
      </section>
    </div>
  );
}
