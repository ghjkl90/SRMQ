import React from 'react';
import './BestEsgPage.css';

const images = import.meta.glob('../../assets/*.{png,jpg,jpeg}', { eager: true });

const getImgSrc = (fileName) => {
  const match = Object.keys(images).find((path) => path.endsWith(`/${fileName}`));
  return match ? images[match].default : '';
};

// 각 기업별로 이미지 파일명과 하단에 들어갈 뱃지(esg) 배열을 정의합니다.
const esgData = [
  {
    category: '산업재',
    companies: [
      { img: '산업재1.png', badges: ['E', 'S', 'G'] },
      { img: '산업재2.png', badges: ['S', 'G'] },
      { img: '산업재3.png', badges: ['S', 'G'] },
      { img: '산업재4.png', badges: ['E'] },
      { img: '산업재5.png', badges: ['E'] },
    ],
  },
  {
    category: '소재',
    companies: [
      { img: '소재1.png', badges: ['E', 'S'] },
      { img: '소재2.png', badges: ['S', 'G'] },
      { img: '소재3.png', badges: ['E'] },
      { img: '소재4.png', badges: ['E'] },
      { img: '소재5.png', badges: ['S'] },
      { img: '소재6.png', badges: ['G'] },
      { img: '소재7.png', badges: ['G'] },
    ],
  },
  {
    category: '금융',
    companies: [
      { img: '금융1.png', badges: ['E', 'S', 'G'] },
      { img: '금융2.png', badges: ['E', 'S'] },
      { img: '금융3.png', badges: ['S', 'G'] },
      { img: '금융4.png', badges: ['E'] },
      { img: '금융5.png', badges: ['G'] },
    ],
  },
  {
    category: '경기소비재',
    companies: [
      { img: '경기소비재1.png', badges: ['E', 'S', 'G'] },
      { img: '경기소비재2.png', badges: ['E', 'S'] },
      { img: '경기소비재3.png', badges: ['E', 'S'] },
      { img: '경기소비재4.png', badges: ['G'] },
      { img: '경기소비재5.png', badges: ['G'] },
    ],
  },
  {
    category: '정보기술',
    companies: [
      { img: '정보기술1.png', badges: ['E', 'S', 'G'] },
      { img: '정보기술2.png', badges: ['E'] },
      { img: '정보기술3.png', badges: ['E'] },
      { img: '정보기술4.png', badges: ['E'] },
      { img: '정보기술5.png', badges: ['S'] },
      { img: '정보기술6.png', badges: ['G'] },
      { img: '정보기술7.png', badges: ['G'] },
    ],
  },
  {
    category: '커뮤니케이션 서비스',
    companies: [
      { img: '커뮤니케이션서비스1.png', badges: ['E', 'S', 'G'] },
      { img: '커뮤니케이션서비스2.png', badges: ['E', 'S', 'G'] },
      { img: '커뮤니케이션서비스3.png', badges: ['E', 'S', 'G'] },
      { img: '커뮤니케이션서비스4.png', badges: ['E', 'G'] },
    ],
  },
  {
    category: '헬스케어',
    companies: [
      { img: '헬스케어1.png', badges: ['E', 'S', 'G'] },
      { img: '헬스케어2.png', badges: ['E', 'S', 'G'] },
      { img: '헬스케어3.png', badges: ['E', 'S', 'G'] },
      { img: '헬스케어4.png', badges: ['E', 'S'] },
    ],
  },
  {
    category: '필수소비재',
    companies: [
      { img: '필수소비재1.png', badges: ['E', 'S'] },
      { img: '필수소비재2.png', badges: ['E', 'G'] },
      { img: '필수소비재3.png', badges: ['S', 'G'] },
      { img: '필수소비재4.png', badges: ['S', 'G'] },
      { img: '필수소비재5.png', badges: ['E'] },
    ],
  },
  {
    category: '에너지',
    companies: [
      { img: '에너지1.png', badges: ['E', 'S', 'G'] },
      { img: '에너지2.png', badges: ['E', 'S'] },
      { img: '에너지3.png', badges: ['S', 'G'] },
      { img: '에너지4.png', badges: ['E'] },
      { img: '에너지5.png', badges: ['G'] },
    ],
  },
  {
    category: '유틸리티',
    companies: [
      { img: '유틸리티1.jpg', badges: ['E', 'S', 'G'] },
      { img: '유틸리티2.png', badges: ['E', 'S', 'G'] },
      { img: '유틸리티3.png', badges: ['E', 'S', 'G'] },
    ],
  },
];

export default function BestEsgPage() {
  return (
    <div className="esg-container">
      <div className="esg-content-wrap">
        
        <div className="esg-header">
          <div className="esg-badge-box">
            <span className="badge-kr">우수 ESG 기업</span>
            <span className="badge-en">GREAT ESG & RECOGNITION</span>
          </div>
          <h2 className="esg-title">2026년 한국 베스트 ESG 기업</h2>
        </div>

        <div className="esg-info-grid">
          <div className="info-column">
            <h3 className="info-column-title">BEST ESG 기업 선정 절차</h3>
            <ul className="esg-bullet-list">
              <li>최근 3년간 지속가능경영보고서 분석</li>
              <li>정성 분석 - 측정성 : 지속가능보고서 텍스트를 기반으로 BERT 모델로 분석</li>
              <li>정량 분석 - 추적성 : 텍스트를 KPI 지표에 근거하여 설명하는 수준 분석</li>
            </ul>
          </div>

          <div className="info-column">
            <h3 className="info-column-title">BEST ESG 오픈 지수</h3>
            <ul className="esg-bullet-list">
              <li>BEST ESG 측정성과 추적성 비율 최근 3년간 평균 우수 조직</li>
              <li>분야별 ESG 오픈 지수 : 전년도 ESG 각각에 대한 오픈 지수 수준의 랭킹</li>
            </ul>
          </div>
        </div>

        {/* 섹터별 기업 로고 그리드 및 우측 하단 E·S·G 미니 뱃지 렌더링 */}
        <div className="esg-matrix-container">
          {esgData.map((row, idx) => (
            <div key={idx} className="esg-category-row">
              <div className="sector-title-cell">{row.category}</div>
              <div className="companies-grid">
                {row.companies.map((comp, imgIdx) => (
                  <div key={imgIdx} className="company-logo-card">
                    <img src={getImgSrc(comp.img)} alt={`${row.category} 로고 ${imgIdx + 1}`} />
                    
                    {/* 우측 하단 E·S·G 작은 박스 추가 */}
                    <div className="esg-badge-wrapper">
                      {comp.badges.map((b, bIdx) => (
                        <span key={bIdx} className={`esg-mini-badge ${b.toLowerCase()}`}>
                          {b}
                        </span>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="esg-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>09</span>
      </div>
    </div>
  );
}