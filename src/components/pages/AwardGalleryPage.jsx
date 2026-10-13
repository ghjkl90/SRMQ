// src/components/pages/AwardGalleryPage.jsx
import { useRef, useState } from 'react';
import './SubpageLayout.css';
import './AwardGalleryPage.css';

const IMAGES = import.meta.glob('../../assets/award-gallery/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

const imageSrc = (year, file) => IMAGES[`../../assets/award-gallery/${year}/${file}`];

const GALLERY = [
  {
    year: 2026,
    title: '2026년 SRMQ 컨벤션 사진',
    sections: [
      {
        title: null,
        photos: [
          { file: '1.jpg', caption: '사회 – 김재룡 전임 원장님' },
          { file: '2.jpg', caption: '대회사 – 사회적책임경영품질원 신완선 회장님' },
          { file: '5.jpg', caption: '축사 – 사회적책임경영품질원 박성현 구 회장님' },
          { file: '3.jpg', caption: '인사말 – 배이열 신임 원장님' },
          { file: '4.jpg', caption: '사경원 회원 • 내빈 기념촬영' },
        ],
      },
      {
        title: '사경원 임원 국제 활동',
        photos: [
          {
            file: '6.jpg',
            caption: 'ANQ 2026 샤오미 레이준 대표 – AI를 품질에 적용한 사례 소개',
          },
          {
            file: '9.jpg',
            caption: '신완선 회장 – 2026년 ANQ 중국 (청두) 대회, 기조강연 ',
          },
        ],
      },
      {
        title: '사경원 임원 국제 활동',
        photos: [
          {
            file: '8.jpg',
            caption: '한영넉스 한영수 회장 – 품질제일 철학',
          },
          {
            file: '7.jpg',
            caption: '한영넉스의 AI 기반 품질경영시스템',
          },
        ],
      },
    ],
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
  {
    year: 2024,
    title: '2024년 SRMQ 컨벤션 사진',
    sections: [
      {
        title: null,
        photos: [
          { file: '1.jpg', caption: '1부 사회 – 단국대학교 이성임 교수님' },
          { file: '2.jpg', caption: '대회사 – 사회적책임경영품질원 박성현 회장님' },
          { file: '3.jpg', caption: '축사 – 서울대학교 유홍림 총장님' },
          { file: '4.jpg', caption: '2부 사회 – 청주대학교 김준호 명예교수님' },
          { file: '5.jpg', caption: '사경원 회원 • 내빈 기념촬영' },
        ],
      },
      {
        title: '2024년 국가경영대상/SRMQ상 시상식',
        photos: [
          {
            file: '6.jpg',
            caption: '국가경영대상(경제부총리겸 기획재정부 장관상) 수상기업',
          },
          {
            file: '7.jpg',
            caption: '국가최고경영자대상(경제부총리겸 기획재정부 장관상) 수상자',
          },
          {
            file: '8.jpg',
            caption: '지속가능경영대상, 경영품질 부문대상, ESG경영 부문대상 수상기업',
          },
          { file: '9.jpg', caption: '안전보건경영 부문대상 수상기업' },
          { file: '10.jpg', caption: 'SRMQ 최고경영자상, 유공자상 수상자' },
          { file: '11.jpg', caption: '전체 수상기업/수상자 단체 사진' },
        ],
      },
      {
        title: '2024 SRMQ 컨벤션 강연',
        photos: [
          { file: '12.jpg', caption: '강연(1) – 구자영 박사 (디지털문화평론가/기획재정부 기업환경과장)' },
          { file: '13.jpg', caption: '강연(2) – 강성모 원장 (KSR인증원)' },
        ],
      },
    ],
  },
  {
    year: 2023,
    title: '2023년 SRMQ 컨벤션 사진',
    sections: [
      {
        title: null,
        photos: [
          { file: '1.jpg', caption: '1부 사회 – 연세대학교 손소영 교수님' },
          { file: '2.jpg', caption: '대회사 – 사회적책임경영품질원 박성현 회장님' },
          { file: '3.jpg', caption: '축사 – 한국품질경영학회 최정일 회장님' },
          { file: '4.jpg', caption: '2부 사회 – 한국소비자안전학회 최병록 회장' },
          { file: '5.jpg', caption: '사경원 회원 단체사진' },
        ],
      },
      {
        title: '2023년 국가경영대상/SRMQ상 시상식',
        photos: [
          {
            file: '6.jpg',
            caption: '명예의 전당',
          },
          {
            file: '7.jpg',
            caption: '국가사회적책임대상, 국가ESG경영대상, 국가안전경영대상 단체사진',
          },
          {
            file: '8.jpg',
            caption: '국가최고경영자대상 단체사진',
          },
          { file: '9.jpg', caption: '지속가능경영대상' },
          { file: '10.jpg', caption: 'ESG경영 부문대상 단체사진' },
          { file: '11.jpg', caption: '안전보건경영 부문대상 단체사진' },
          { file: '12.jpg', caption: 'SRMQ 유공자상 단체사진' },
          { file: '13.jpg', caption: '수상자 단체사진' },
        ],
      },
      {
        title: '2023년 기조강연',
        photos: [
          { file: '14.jpg', caption: '강연(1) – 경기대학교 노형진 명예교수' },
          { file: '15.jpg', caption: '강연(2) – 기업재난안전협회 황순현 회장' },
        ],
      },
    ],
  },
  {
    year: 2022,
    title: '2022년 SRMQ 컨벤션 사진',
    sections: [
      {
        title: null,
        photos: [
          { file: '1.jpg', caption: '1부 사회 – 연세대학교 손소영 교수님' },
          { file: '2.jpg', caption: '대회사 – 사회적책임경영품질원 박성현 회장님' },
          { file: '3.jpg', caption: '축사 – 자동차부품산업진흥재단 오원석 이사장님' },
          { file: '4.jpg', caption: '심사경과 보고서 – 한남대학교 김태규 교수님' },
          { file: '5.jpg', caption: '2부 사회 – 혁신경영연구원 이재하 원장님' },
          { file: '6.jpg', caption: '사경원 회원 단체사진' },
        ],
      },
      {
        title: '국가경영대상/SRMQ상 시상식',
        photos: [
          {
            file: '7.jpg',
            caption: '명예의 전당',
          },
          {
            file: '8.jpg',
            caption: 'ESG경영 대상, 사회적책임 대상, 경영품질 대상 단체사진',
          },
          {
            file: '9.jpg',
            caption: '최고경영자대상 단체사진',
          },
          { file: '10.jpg', caption: '지속가능경영대상 및 사회공헌대상 단체사진' },
          { file: '11.jpg', caption: 'ESG경영 부문대상 단체사진' },
          { file: '12.jpg', caption: '사회적책임 부문대상 및 경영품질 부문대상 단체사진' },
          { file: '13.jpg', caption: 'SRMQ유공자상 단체사진' },
          { file: '14.jpg', caption: '수상자 단체사진' },
        ],
      },
      {
        title: '기조강연',
        photos: [
          { file: '15.jpg', caption: '강연(1) 숭실대학교 최정일 교수님' },
          { file: '16.jpg', caption: '기획재정부 구자영 과장님' },
          { file: '17.jpg', caption: '수상기업 사례발표 : 한전KDN' },
        ],
      },
    ],
  },
  {
    year: 2021,
    title: '2021년 SRMQ 컨벤션 사진',
    sections: [
      {
        title: null,
        photos: [
          { file: '1.jpg', caption: '1부 사회 – 연세대학교 손소영 교수님' },
          { file: '2.jpg', caption: '대회사 – 사회적책임경영품질원 박성현 회장님' },
          { file: '3.jpg', caption: '축사 – 서울대학교 오세정 총장님' },
          { file: '4.jpg', caption: '심사경과 보고서 – 한남대학교 김태규 교수님' },
          { file: '5.jpg', caption: '2부 사회 – 혁신경영연구원 이재하 원장님' },
        ],
      },
      {
        title: '국가경영대상/SRMQ상 시상식',
        photos: [
          {
            file: '6.jpg',
            caption: 'ESG경영 대상 및 사회적책임 대상 단체사진',
          },
          {
            file: '7.jpg',
            caption: '최고경영자대상 단체사진',
          },
          {
            file: '8.jpg',
            caption: '지속가능경영대상 및 혁신성장대상 단체사진',
          },
          { file: '9.jpg', caption: '사회적책임 부문대상 단체사진' },
          { file: '10.jpg', caption: '경영품질 부문대상 단체사진' },
          { file: '11.jpg', caption: 'SRMQ유공자상 단체사진' },
        ],
      },
      {
        title: '기조강연',
        photos: [
          { file: '12.jpg', caption: '연세대학교 경영전문 대학원 문두철 부원장님' },
          { file: '13.jpg', caption: '(주)아이엠에스알 서동욱 대표님' },
        ],
      },
    ],
  },
  {
    year: 2020,
    title: '2020년 SRMQ 컨벤션 사진',
    sections: [
      {
        title: null,
        photos: [
          { file: '1.jpg', caption: '사회 – 한국방송통신대학교 이태림 명예교수님' },
          { file: '2.jpg', caption: '대회사 – 사회적책임경영품질원 박성현 회장님' },
          { file: '3.jpg', caption: '축사 – 오 명 명예회장님' },
        ],
      },
      {
        title: '국가경영대상/SRMQ상 시상식',
        photos: [
          {
            file: '6.jpg',
            caption: '사회적책임 대상 – 한전KDN(주)',
          },
          {
            file: '7.jpg',
            caption: '사회적책임 대상 – 여수광양항만공사',
          },
          {
            file: '8.jpg',
            caption: '경영품질 대상 – 한국중부발전(주)',
          },
          { file: '9.jpg', caption: '경영품질 대상 – (주)에이치피앤씨' },
          { file: '10.jpg', caption: '전체 수상기업/수상자 기념 촬영' },
          { file: '11.jpg', caption: '아이에스동서(주) 권혁운 회장' },
          { file: '12.jpg', caption: '(사)한국환경건축연구원 이경회 이사장' },
          { file: '13.jpg', caption: '단체사진' },
          { file: '16.jpg', caption: '사회공헌 부문 – (주) 에스알' },
          { file: '17.jpg', caption: '사회공헌 부문 – 국립국제교육원' },
          { file: '18.jpg', caption: '윤리경영·부패방지 부문 – (사)한국선급' },
          { file: '19.jpg', caption: '윤리경영·부패방지 부문 – (주)비욘드테크' },
          { file: '20.jpg', caption: '상생협력부문 – 연구개발특구진흥재단' },
          { file: '21.jpg', caption: '기후·환경 부문 – 청해ENV(주)' },
          { file: '22.jpg', caption: '단체사진' },
          { file: '23.jpg', caption: '품질혁신 부문 – 대일특수강(주)' },
          { file: '24.jpg', caption: '기술혁신 부문 – 삼광기계' },
          { file: '25.jpg', caption: '교육혁신부문  – 용인송담대학교' },
          { file: '26.jpg', caption: '지속가능경영부문 – 주성디자인랩(주)' },
          { file: '27.jpg', caption: '경영혁신 최고경영자상 – 테크빌교육(주) 이형세 대표' },
          { file: '28.jpg', caption: 'SRMQ유공자상 – 신한신용정보 문진호 단장' },
        ],
      },
      {
        title: '기조강연',
        photos: [
          { file: '29.jpg', caption: ' ' },
          { file: '30.jpg', caption: ' ' },
          { file: '31.jpg', caption: ' ' },
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
          <h1 className="subpage-title">포상 갤러리</h1>
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
