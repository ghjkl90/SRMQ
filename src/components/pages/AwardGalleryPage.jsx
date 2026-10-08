// src/components/pages/AwardGalleryPage.jsx
import { useRef, useState } from 'react';
import './SubpageLayout.css';
import './AwardGalleryPage.css';

// 사진 파일 위치: src/assets/award-gallery/{연도}/
// 다른 페이지 이미지처럼 Vite가 import로 묶어 주므로 배포 경로(base)가 바뀌어도 그대로 보입니다.
const IMAGES = import.meta.glob('../../assets/award-gallery/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

const imageSrc = (year, file) => IMAGES[`../../assets/award-gallery/${year}/${file}`];

// 연도별 사진 데이터. 새 연도는 배열 맨 앞에 추가하면 탭이 최신순으로 유지됩니다.
// 섹션 title이 null이면 소제목 없이 연도 제목 바로 아래에 사진이 놓입니다.
const GALLERY = [
  {
    year: 2026,
    title: '2026년 SRMQ 컨벤션 사진',
    sections: [],
  },
  {
    year: 2025,
    title: '2025년 SRMQ 컨벤션 사진',
    sections: [
      {
        title: null,
        photos: [
          { file: '01-moderator.jpg', caption: '사회 – 한국방송통신대학교 이태림 명예교수님' },
          { file: '02-opening-address.jpg', caption: '대회사 – 사회적책임경영품질원 박성현 회장님' },
          { file: '03-congratulatory-address.jpg', caption: '축사 – 한국환경건축연구원 이경회 이사장님' },
          { file: '04-members-and-guests.jpg', caption: '사경원 회원 • 내빈 기념촬영' },
        ],
      },
      {
        title: '국가경영대상/SRMQ상 시상식',
        photos: [
          {
            file: '05-national-management-award.jpg',
            caption: '국가경영대상(경제부총리겸 기획재정부 장관상) 수상기업',
          },
          {
            file: '06-national-ceo-award.jpg',
            caption: '국가최고경영자대상(경제부총리겸 기획재정부 장관상) 수상자',
          },
          {
            file: '07-category-awards.jpg',
            caption: '혁신성장대상, 기술혁신 부문대상, 안전보건경영 부문대상 수상기업(사경원 회장상)',
          },
          { file: '08-srmq-merit-award.jpg', caption: 'SRMQ 유공자상 수상자' },
          { file: '09-all-winners.jpg', caption: '전체 수상기업/수상자 기념 촬영' },
        ],
      },
      {
        title: '기조강연',
        photos: [
          { file: '10-keynote.jpg', caption: '주영섭 서울대학교 특임교수 (전, 중소기업청장)' },
        ],
      },
    ],
  },
];

const countPhotos = ({ sections }) =>
  sections.reduce((sum, section) => sum + section.photos.length, 0);

// 데이터에 적은 파일이 폴더에 없으면 개발 서버 콘솔에 알려 줍니다.
if (import.meta.env.DEV) {
  GALLERY.forEach(({ year, sections }) =>
    sections.forEach(({ photos }) =>
      photos.forEach(({ file }) => {
        if (!imageSrc(year, file)) {
          console.warn(`[포상갤러리] 사진 파일 없음: src/assets/award-gallery/${year}/${file}`);
        }
      }),
    ),
  );
}

// 사진이 등록된 가장 최근 연도를 처음에 보여 줍니다.
const DEFAULT_YEAR = (GALLERY.find((entry) => countPhotos(entry) > 0) ?? GALLERY[0]).year;

const AwardGalleryPage = () => {
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR);
  const tabRefs = useRef({});

  const entry = GALLERY.find((item) => item.year === selectedYear);
  const total = countPhotos(entry);

  // 좌우 화살표 키로 연도 탭 이동
  const handleTabKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;

    event.preventDefault();
    const index = GALLERY.findIndex((item) => item.year === selectedYear);
    const nextYear = GALLERY[(index + step + GALLERY.length) % GALLERY.length].year;
    setSelectedYear(nextYear);
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
          <h1 className="subpage-title">포상 및 행사 갤러리</h1>
          <p className="subpage-desc">
            사단법인 사회적책임경영품질원의 국가경영대상/SRMQ상 시상식과 컨벤션 현장을 사진으로
            전해드립니다.
          </p>
        </header>

        {/* 연도 탭 */}
        <div className="award-gallery-toolbar">
          <div
            className="award-gallery-tabs"
            role="tablist"
            aria-label="연도 선택"
            onKeyDown={handleTabKeyDown}
          >
            {GALLERY.map(({ year }) => {
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
                  onClick={() => setSelectedYear(year)}
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
          aria-labelledby={`award-gallery-tab-${selectedYear}`}
        >
          {total === 0 ? (
            <p className="award-gallery-empty">{selectedYear}년 사진은 준비 중입니다.</p>
          ) : (
            <>
              <h2 className="award-gallery-year-title">{entry.title}</h2>
              <div className="award-gallery-sections">
                {entry.sections.map((section, index) => (
                  <div className="award-gallery-section" key={index}>
                    {section.title && (
                      <h3 className="award-gallery-section-title">{section.title}</h3>
                    )}
                    <ul className="award-gallery-grid">
                      {section.photos.map((photo) => (
                        <li key={photo.file}>
                          <figure className="award-gallery-item">
                            <img
                              src={imageSrc(entry.year, photo.file)}
                              alt={photo.caption}
                              loading="lazy"
                              decoding="async"
                            />
                            <figcaption>{photo.caption}</figcaption>
                          </figure>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
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
