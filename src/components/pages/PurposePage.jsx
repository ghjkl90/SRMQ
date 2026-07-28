import React from 'react';
import purposeImg from '../../assets/purpose.png';
import './PurposePage.css';

export default function PurposePage() {
  return (
    <div className="purpose-container">
      
      {/* 상단 히어로 섹션 */}
      <div className="purpose-hero">
        <img src={purposeImg} alt="설립목적 배경 이미지" className="purpose-hero-bg" />
        <div className="purpose-hero-overlay"></div>

        <div className="purpose-hero-content">
          <div className="purpose-badge-box">
            <span className="badge-kr">설립목적·주요사업</span>
            <span className="badge-en">PURPOSE & PROGRAMS</span>
          </div>

          <div className="purpose-tag">설립목적</div>
          <h2 className="purpose-hero-title">
            지속가능한 경제성장과 사회 발전에 기여하기 위해,<br />
            사회적책임 · 경영품질 등을 지원하는 구심적 역할을 수행하여<br />
            국가·사회 발전에 공헌합니다.
          </h2>
        </div>
      </div>

      {/* 하단 주요사업 컨테이너 */}
      <div className="purpose-content">
        <h3 className="section-title">주요사업</h3>

        <div className="business-grid">
          
          {/* 1. 진단과 평가 (#4B9321) */}
          <div className="business-card">
            <div className="business-icon icon-green-light">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4B9321" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="business-info">
              <h4 className="business-name">진단과 평가</h4>
              <p className="business-desc">사회적책임 · 경영품질 · ESG · 안전보건경영에 대해 국제 기준에 의한 진단·평가를 실시하여 지속개선과 성과향상을 지원합니다.</p>
            </div>
          </div>

          {/* 2. 포상제도 운영 (#1B9461) */}
          <div className="business-card">
            <div className="business-icon icon-green-dark">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1B9461" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <div className="business-info">
              <h4 className="business-name">포상제도 운영</h4>
              <p className="business-desc">바람직한 경영모델 및 평가지표 개발을 통해 자가진단·평가를 지원하고, 우수한 조직과 개인을 포상합니다.</p>
            </div>
          </div>

          {/* 3. 정기 컨벤션 · 컨퍼런스 (#1B7894) */}
          <div className="business-card">
            <div className="business-icon icon-blue">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1B7894" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            </div>
            <div className="business-info">
              <h4 className="business-name">정기 컨벤션 · 컨퍼런스</h4>
              <p className="business-desc">우수사례 보급과 실천방안 제시를 위한 정기 컨벤션 및 컨퍼런스를 개최합니다.</p>
            </div>
          </div>

          {/* 4. 교육훈련과 인력 양성 (#4B9321) */}
          <div className="business-card">
            <div className="business-icon icon-green-light">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4B9321" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
            </div>
            <div className="business-info">
              <h4 className="business-name">교육훈련과 인력 양성</h4>
              <p className="business-desc">분야별 교육프로그램을 통해 추진인력 및 전문가 양성을 지원하고 지도합니다.</p>
            </div>
          </div>

          {/* 5. 정책연구 및 개발 (#1B7894) */}
          <div className="business-card">
            <div className="business-icon icon-blue">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1B7894" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div className="business-info">
              <h4 className="business-name">정책연구 및 개발</h4>
              <p className="business-desc">산·학·연 전문가에 의한 정부·유관기관의 실천·확산 정책을 연구하고 지원합니다.</p>
            </div>
          </div>

          {/* 6. 출판 및 보급 (#1B9461) */}
          <div className="business-card">
            <div className="business-icon icon-green-dark">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1B9461" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div className="business-info">
              <h4 className="business-name">출판 및 보급</h4>
              <p className="business-desc">사회적책임 · 경영품질 · ESG · 안전보건경영 등 도서 및 우수사례를 출판·보급합니다.</p>
            </div>
          </div>

        </div>
      </div>

      {/* 최하단 바 */}
      <div className="purpose-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>04</span>
      </div>

    </div>
  );
}