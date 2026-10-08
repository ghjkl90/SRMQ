import React from 'react';
import './SubpageLayout.css';
import './PolicyResearchPage.css';
import bannerImg from '../../assets/policy-banner.png';

const FIELDS = [
  { title: 'SR 및 MQ 평가제도', sub: '평가기준 · 평가지표' },
  { title: '공기업 경영혁신', sub: '공공기관 정책연구' },
  { title: '서비스산업 선진화', sub: '금융·의료·학교·관광 등' },
  { title: '중소기업 SR 가이드', sub: '실천 및 가이드라인' },
  { title: '지속가능 경영환경', sub: 'ESG 기반 조성 연구' },
  { title: 'SR문화 보급·확산', sub: '사회적책임 문화 정착' },
];

const STEPS = [
  { step: 'STEP 01', title: '과제 발굴 및 위탁 지원' },
  { step: 'STEP 02', title: '산·학·연 전문가 연구진 구성' },
  { step: 'STEP 03', title: '정책·제도 연구 및 개발' },
  { step: 'STEP 04', title: '적용 평가 및 사후 개선', last: true },
];

const OUTCOMES = [
  { title: '연구 협력 체계', desc: '산·학·연 연계 네트워크 운영 및 정부 부처·공공기관 맞춤형 지속가능 경영 정책 제안 체계 가동' },
  { title: '기대 효과 & 활용', desc: '국가 표준 정책 수립 지원, 기업 경영품질 향상 가이드 제공 및 실천적 제도화 대국민 확산' },
];

const PolicyResearchPage = () => {
  return (
    <div className="subpage-container pol-page">
      <div className="subpage-content">

        {/* 상단 타이틀 영역 (SubpageLayout.css 공통) */}
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">정책연구</span>
            <span className="subpage-badge-en">POLICY RESEARCH & R&D</span>
          </div>
          <h1 className="subpage-title">정책연구 개요</h1>
          <p className="subpage-desc">
            국제환경 변화와 시대적 요구에 따라 우리 산업·사회가 지속적으로 추구해야 할 사회적책임, 경영품질, 지속가능경영, 서비스 선진화 등과 관련된 정부정책 및 제도를 뒷받침하기 위한 연구·개발을 수행합니다.
          </p>
        </header>

        <div className="pol-banner">
          <img src={bannerImg} alt="정책연구 회의" />
        </div>

        {/* 1. 연구·개발분야 */}
        <section className="pol-box field">
          <div className="pol-box-head">
            <h2 className="pol-box-title">1. 연구·개발분야</h2>
            <span className="pol-box-aside">SRMQ 중점 연구 테마 및 전문 정책 개발 영역</span>
          </div>
          <div className="pol-field-grid">
            {FIELDS.map((f) => (
              <div className="pol-field-card" key={f.title}>
                <strong>{f.title}</strong>
                <span>{f.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. 연구·개발 시행방법 */}
        <section className="pol-box method">
          <div className="pol-box-head">
            <h2 className="pol-box-title">2. 연구·개발 시행방법</h2>
            <span className="pol-box-aside">
              정부 및 유관기관 지원(위탁연구)을 바탕으로 산·학·연 전문가를 구성하여 관련 정책 및 제도를 연구·개발하고 적용 평가
            </span>
          </div>
          <ol className="pol-step-grid">
            {STEPS.map((s) => (
              <li className="pol-step-card" key={s.step}>
                <span className={`pol-step-label ${s.last ? 'last' : ''}`}>{s.step}</span>
                <strong>{s.title}</strong>
              </li>
            ))}
          </ol>
        </section>

        {/* 협력 체계 / 기대 효과 */}
        <div className="pol-outcome-grid">
          {OUTCOMES.map((o) => (
            <div className="pol-outcome-card" key={o.title}>
              <h3>{o.title}</h3>
              <p>{o.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* 최하단 바 */}
      <footer className="subpage-bottom-bar">
        <span>© National Awards & Quality Management Convention. All rights reserved.</span>
        <span>Policy Research & R&D</span>
      </footer>
    </div>
  );
};

export default PolicyResearchPage;
