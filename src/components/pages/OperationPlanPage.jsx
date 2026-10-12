import React from 'react';
import './SubpageLayout.css';
import './OperationPlanPage.css';

export default function OperationPlanPage() {
  return (
    <div className="subpage-container">

      <div className="subpage-content">

        {/* 상단 헤더 및 타이틀 (SubpageLayout.css 공통) */}
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">운영 계획</span>
            <span className="subpage-badge-en">OPERATIONAL PLAN</span>
          </div>
          <h1 className="subpage-title">운영 계획</h1>
          <p className="subpage-desc">
            사회적 책임과 경영 품질 전문가가 동참하는 플랫폼을 만들고자 합니다. 지속 가능한 사회를 위해서 신뢰 구축, 책임 경영, 글로벌 선도에 필요한 세부 계획을 수립하여 단계적으로 추진합니다.
          </p>
        </header>

        {/* 본문: 비전 · 목표 · 방법 섹션 3개 (섹션 사이 간격은 회원 안내와 동일) */}
        <div className="plan-body">

          {/* 1. 비전 섹션 */}
          <div className="plan-section-box plan-vision-box">
            <h3 className="plan-section-title">비전</h3>

            <div className="plan-vision">
              <span className="plan-vision-label">비전 VISION</span>
              <div className="plan-vision-banner">Inspiring the Humanity Driven Society</div>
              <div className="plan-vision-roof">GOVERNANCE & INTEGRITY</div>
              <div className="plan-vision-base">Grace in Action, Peace in Community</div>
            </div>
          </div>

          {/* 2. 2026~2030년도 목표 섹션 */}
          <div className="plan-section-box">
            <h3 className="plan-section-title">2026~2030년도 목표</h3>

            <div className="plan-cards-grid">

              {/* 산업별 ESG&품질 전문가 */}
              <div className="plan-card">
                <div className="plan-card-head">
                  <span className="plan-card-title">산업별 ESG&품질 전문가</span>
                  <span className="plan-card-sub">7대 사업본부</span>
                </div>
                <ul className="plan-list">
                  <li>산업별 AX 품질전문가 확보</li>
                  <li>
                    산업별 AX 가이드 제공
                    <span className="plan-list-note">
                      (전기전자, 기계자동차, 생활환경건설, 화학통합, 에너지원전, 바이오헬스, 방산조선)
                    </span>
                  </li>
                  <li>품질한국 명예의 전당</li>
                </ul>
              </div>

              {/* 글로벌 선도 AX 인프라 */}
              <div className="plan-card">
                <div className="plan-card-head">
                  <span className="plan-card-title">글로벌 선도 AX 인프라</span>
                  <span className="plan-card-sub">4대 사업 인프라</span>
                </div>
                <ul className="plan-list">
                  <li>ESG 우수기업 평가 지수</li>
                  <li>AI 인프라 기반 지식서비스</li>
                  <li>글로벌 ODA BP 공유 모델</li>
                  <li>AX 가이드 기반 회원사 서비스</li>
                </ul>
              </div>

              {/* 지속가능경영 BP 공유 */}
              <div className="plan-card">
                <div className="plan-card-head">
                  <span className="plan-card-title">지속가능경영 BP 공유</span>
                  <span className="plan-card-sub">SRMQ 컨벤션 개최</span>
                </div>
                <ul className="plan-list">
                  <li>재경부 지속가능경영상 포상</li>
                  <li>박성현 GDS 메달 포상</li>
                  <li>베스트 한국도시&고교동문</li>
                  <li>베스트 글로벌 ODA 사업</li>
                </ul>
              </div>

            </div>
          </div>

          {/* 3. 방법 섹션 (위 목표 카드와 같은 열끼리 짝을 이룸) */}
          <div className="plan-section-box">
            <h3 className="plan-section-title">방법</h3>

            <div className="plan-cards-grid">

              {/* 전문가 확보 · AX 가이드 */}
              <div className="plan-card">
                <ul className="plan-list">
                  <li>
                    산업별로 전문가 20명
                    <span className="plan-list-note">(Perception 5명, Generative 5명, Agentic 10명)</span>
                  </li>
                  <li>분야별 AX 가이드 개발</li>
                  <li>AX 경영시스템 구축 과제 신청</li>
                </ul>
              </div>

              {/* AX 인프라 · 플랫폼 */}
              <div className="plan-card">
                <ul className="plan-list">
                  <li>DQM 디지털품질경영 시스템</li>
                  <li>디지털공간품질 DSQ 시스템</li>
                  <li>ESG 오픈폴리티 지수</li>
                  <li>K-AI Station 플랫폼</li>
                  <li>제조산업 AX 표준가이드</li>
                </ul>
              </div>

              {/* 포상 · 선정 */}
              <div className="plan-card">
                <ul className="plan-list">
                  <li>기재부 장관상 6개 부문 포상</li>
                  <li>ESG 우수기업을 홈피에 공지</li>
                  <li>Bridge&Blend 베스트동문 선정</li>
                  <li>심리적 격차 최소 도시 선정</li>
                  <li>글로벌 공헌 베스트 기업 선정</li>
                </ul>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* 최하단 바 */}
      <footer className="subpage-bottom-bar">
        <span>사회적책임경영품질원</span>
        <span>07</span>
      </footer>

    </div>
  );
}
