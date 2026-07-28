import React from 'react';
import './GreetingPage.css';

export default function GreetingPage() {
  return (
    <div className="greeting-container">
      
      {/* 상단: 인사말 배지, 타이틀, 본문 단락 */}
      <div className="greeting-header">
        <div className="greeting-badge-box">
          <span className="badge-kr">인사말</span>
          <span className="badge-en">GREETING</span>
        </div>

        <h1 className="greeting-title">
          책임 있는 경영이<br />
          지속가능한 미래를 만듭니다.
        </h1>

        <div className="greeting-desc-box">
          <p className="greeting-desc">
            AX 시대를 맞이하여 모든 조직의 경영환경은 급속히 변화하고 있습니다. 불확실성의 증가와 치열한 경쟁 속에서, 조직의 투명성 제고와 사회적책임의 실행, 품질과 기술의 혁신, 환경과 안전의 추구 등 국제기준에 부합하는 체계와 능력을 갖추지 않고는 지속적인 성장을 기대하기 어렵습니다.
          </p>
          <p className="greeting-desc">
            국제표준화기구(ISO)는 조직의 사회적 책임에 관한 지침 'ISO 26000'을 제정하며, 그 핵심 목표를 '지속가능한 개발에 기여하는 것'으로 정의했습니다. 이러한 시대적 요구에 부응하고자, 우리 원은 2013년 1월 비영리 법인으로 설립되어 기획재정부의 승인을 받아 운영되고 있습니다.
          </p>
          <p className="greeting-desc">
            사회책임경영품질원(SRMQ)은 ESG 사회적책임 · 지속가능경영 · 경영품질 · 서비스경쟁력 강화 등 시대가 요구하는 역할을 더욱 충실히 담당하겠습니다. 뜻을 같이하시는 여러분의 많은 관심과 성원을 부탁드립니다.
          </p>
        </div>
      </div>

      {/* 하단: 회장 직함 영역 (사진은 배경으로 깔림) */}
      <div className="greeting-footer-content">
        <div className="greeting-author">
          <span className="author-org">(사)사회책임경영품질원</span>
          <span className="author-name">회장 박성현</span>
        </div>
      </div>

      {/* 최하단 바 */}
      <div className="greeting-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>02</span>
      </div>

    </div>
  );
}