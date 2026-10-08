import React from 'react';
import './SubpageLayout.css';
import './EvaluationPage.css';

export default function EvaluationPage() {
  return (
    <div className="subpage-container">
      
      <div className="subpage-content">

        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">진단·평가·교육</span>
            <span className="subpage-badge-en">EVALUATION & EDUCATION</span>
          </div>
          <h1 className="subpage-title">진단 · 평가 프로세스</h1>
        </header>

        <div className="process-flow-box">
          <div className="process-step-circle step-1">
            <span className="step-number">1</span>
            <span className="step-label">신청</span>
          </div>
          <div className="process-step-circle step-2">
            <span className="step-number">2</span>
            <span className="step-label">서류심사</span>
          </div>
          <div className="process-step-circle step-3">
            <span className="step-number">3</span>
            <span className="step-label">전문가 현장평가</span>
          </div>
          <div className="process-step-circle step-4">
            <span className="step-number">4</span>
            <span className="step-label">결과 피드백</span>
          </div>
          <div className="process-step-circle step-5">
            <span className="step-number">5</span>
            <span className="step-label">인증 · 포상</span>
          </div>
        </div>

        <div className="eval-divider"></div>

        <div className="eval-rows-wrap">
          
          <div className="eval-row-item">
            <h3 className="eval-row-title">교육훈련과 지도</h3>
            <ul className="eval-row-list">
              <li>ESG · 지속가능경영 전문가 양성 과정 운영</li>
              <li>사회적책임 · 경영품질 · 안전보건경영 분야별 교육</li>
              <li>조직 추진인력 역량 강화 및 실무 지도</li>
            </ul>
          </div>

          <div className="eval-row-item">
            <h3 className="eval-row-title">정책연구 · 출판</h3>
            <ul className="eval-row-list">
              <li>산 · 학 · 연 전문가 기반 정책 연구개발</li>
              <li>사회적책임 지수 · ESG 지수 등 평가지표 개발</li>
              <li>도서 및 우수사례 출판 · 보급</li>
            </ul>
          </div>

          <div className="eval-row-item">
            <h3 className="eval-row-title blue-type">국제 기준 기반 평가</h3>
            <ul className="eval-row-list">
              <li>ISO 26000 등 국제 사회적책임 지침에 부합하는 진단 · 평가 체계</li>
              <li>단순 시상이 아닌 지속적 개선과 성과향상을 지원하는 실질적 컨설팅</li>
            </ul>
          </div>

        </div>

      </div>

      <footer className="subpage-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>06</span>
      </footer>

    </div>
  );
}
