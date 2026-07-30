import React from 'react';
import awardImg from '../../assets/award.png'; // 👈 award.png 에셋 임포트
import './AwardPage.css';

export default function AwardPage() {
  return (
    <div className="award-container">
      
      <div className="award-content-wrap">
        
        {/* 상단 헤더 및 타이틀 */}
        <div className="award-header">
          <div className="award-badge-box">
            <span className="badge-kr">포상제도</span>
            <span className="badge-en">NATIONAL AWARDS</span>
          </div>
          <h2 className="award-title">국가경영대상 · SRMQ상</h2>
          <p className="award-desc">사회적책임경영품질 컨벤션에서 매년 시상하는 대한민국 대표 경영품질 포상</p>
        </div>

        {/* 상단 대형 이미지 */}
        <div className="award-image-wrapper">
          <img src={awardImg} alt="포상제도 이미지" />
        </div>

        {/* 1. 기획재정부 장관상 섹션 (6개 대상) */}
        <div className="award-section-box">
          <h3 className="section-box-title">기획재정부 장관상</h3>
          <div className="award-cards-grid grid-6">
            <div className="award-card">국가<br />사회적책임대상</div>
            <div className="award-card">국가<br />경영품질대상</div>
            <div className="award-card">국가<br />ESG경영대상</div>
            <div className="award-card">국가<br />안전경영대상</div>
            <div className="award-card">국가<br />AI경영대상</div>
            <div className="award-card">국가<br />최고경영자대상</div>
          </div>
        </div>

        {/* 2. 회장상 · 부문대상 섹션 (5개 대상) */}
        <div className="award-section-box blue-theme">
          <h3 className="section-box-title">회장상 · 부문대상</h3>
          <div className="award-cards-grid grid-5">
            <div className="award-card blue-card">지속가능경영</div>
            <div className="award-card blue-card">경영품질</div>
            <div className="award-card blue-card">ESG경영</div>
            <div className="award-card blue-card">안전보건경영</div>
            <div className="award-card blue-card">사회공헌</div>
          </div>
        </div>

        {/* 3. 하단 2분할 (평가영역 / 참여 효과) */}
        <div className="award-bottom-grid">
          <div className="award-info-card">
            <h4 className="info-card-title">평가영역</h4>
            <p className="info-card-desc">리더십 · 사회적책임 실행 · 인권 · 노동관행 · 지역사회 참여 · 발전 · 환경 · 사회문제 해결 등 전 영역</p>
          </div>

          <div className="award-info-card">
            <h4 className="info-card-title">참여 효과</h4>
            <p className="info-card-desc">대외 공신력 확보 · 경영개선 진단 리포트 · 적극적 홍보 활용 · ESG · 안전 대응역량</p>
          </div>
        </div>

      </div>

      {/* 최하단 바 */}
      <div className="award-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>05</span>
      </div>

    </div>
  );
}