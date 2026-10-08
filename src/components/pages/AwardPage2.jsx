import React from 'react';
import './SubpageLayout.css';
import './AwardPage2.css';

const AwardPage2 = () => {
  return (
    <div className="subpage-container">
      {/* 본문 콘텐츠 래퍼 */}
      <div className="subpage-content">
        
        {/* 상단 타이틀 영역 */}
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">포상제도</span>
            <span className="subpage-badge-en">NATIONAL AWARDS</span>
          </div>
          <h1 className="subpage-title">의의 및 분야</h1>
          <p className="subpage-desc">
            사회적책임경영품질 컨벤션에서 매년 시상하는 대한민국 대표 경영품질 포상
          </p>
        </header>

        {/* 01, 02 행 영역: 좌측 제목 / 우측 항목, 행 사이 회색 구분선 */}
        <div className="award-grid-section">
          <div className="award-row">
            <h3 className="strategy-title">01. 새로운 경영문화 창출, 보급 및 확산</h3>
            <ul className="strategy-list">
              <li>사회적책임(SR), 경영품질(MQ), ESG, 안전보건 등을 중시하는 <strong>혁신적 선진 조직문화 창출</strong></li>
              <li>산업 전반의 우수 모범사례를 체계적으로 발굴하고 전국적으로 공유·전파하여 대한민국 산업 및 공공 생태계 경쟁력 강화</li>
              <li>K-ESG 가이드라인 및 국제표준(ISO 26000, ISO 9001, ISO 45001)에 부합하는 국가 품질 표준 선도</li>
            </ul>
          </div>

          <div className="award-row">
            <h3 className="strategy-title teal">02. 조직의 지속가능성 경영기반 구축</h3>
            <ul className="strategy-list">
              <li>조직의 재무적 성과뿐만 아니라 비재무적(환경·사회·지배구조) 가치를 통합 관리하는 <strong>지속가능경영(Sustainability) 실현</strong></li>
              <li>글로벌 공급망 ESG 실사법 및 탄소중립 신질서에 유연하게 대응할 수 있는 미래지향적 위기관리 체계 마련</li>
              <li>임직원, 주주, 고객, 협력업체 및 지역사회를 포괄하는 다자간 이해관계자 신뢰 기반 거버넌스 확립 지원</li>
            </ul>
          </div>
        </div>

        {/* 하단 2단 카드 박스 영역 */}
        <div className="award-bottom-cards-grid">
          
          {/* 기획재정부 장관상 카드 */}
          <div className="award-card-box">
            <div className="award-card-header">
              <h3 className="award-card-title">기획재정부 장관상</h3>
              <span className="award-tag green-tag">정부포상</span>
            </div>
            
            <div className="award-card-content">
              <div className="award-section-block">
                <strong className="award-sub-title">[조직 종합대상]</strong>
                <ul className="award-list">
                  <li>국가사회적책임대상 (SR 분야 종합)</li>
                  <li>국가경영품질대상 (MQ 분야 종합)</li>
                  <li>국가ESG경영대상 (환경·사회·지배구조)</li>
                  <li>국가안전경영대상 (보건·안전보건 체계)</li>
                </ul>
              </div>
              <div className="award-section-block divider">
                <strong className="award-sub-title">[개인 대상]</strong>
                <ul className="award-list">
                  <li>국가최고경영자대상 (선도적 경영인)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 사단법인 회장상 카드 */}
          <div className="award-card-box">
            <div className="award-card-header">
              <h3 className="award-card-title">사단법인 회장상</h3>
              <span className="award-tag dark-green-tag">회장 표창</span>
            </div>
            
            <div className="award-card-content">
              <div className="award-section-block">
                <strong className="award-sub-title">[조직 종합대상]</strong>
                <ul className="award-list">
                  <li>사회공헌 대상 / 혁신성장 대상 / 지속가능경영 대상</li>
                </ul>
              </div>
              <div className="award-section-block divider">
                <strong className="award-sub-title">[부문대상]</strong>
                <ul className="award-list">
                  <li>SR · MQ · ESG · 안전보건 부문별 혁신 우수사례</li>
                </ul>
              </div>
              <div className="award-section-block divider">
                <strong className="award-sub-title">[개인상]</strong>
                <ul className="award-list">
                  <li>최고경영자상 / 유공자상 (현장 실무 공로자)</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 최하단 바 */}
      <footer className="subpage-bottom-bar">
        <span>© National Awards & Quality Management Convention. All rights reserved.</span>
        <span>National Awards Overview</span>
      </footer>
    </div>
  );
};

export default AwardPage2;
