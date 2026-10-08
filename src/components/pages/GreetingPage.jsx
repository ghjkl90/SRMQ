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
          Self Responsibility<br />
          신뢰 사회를 함께 만들겠습니다.
        </h1>

        <div className="greeting-desc-box">
          <p className="greeting-desc">
             우리는 지금 격화되는 국제적 갈등과 날로 심화되는 사회적 양극화, 그리고 네팔 사고 등 세계 곳곳에서 분출되는 지속가능성에 대한 심각한 위협에 직면해 있습니다. 이러한 시대적 위기를 극복하기 위해 우리는 인간 중심의 따뜻한 상생 사례, 서로를 배려하는 포용의 사례, 그리고 장기적이고 올바른 사고방식에 근거한 우수사례를 적극 발굴하고 공유해야 합니다. 성공 사례를 찾아 나누고 소통해야만 우리가 마주한 위기의 해결책을 쌓을 수 있기 때문입니다.
          </p>
          <p className="greeting-desc">
             2013년 재정경제부의 승인을 받아 비영리 법인으로 운영되고 있는 사회적책임경영품질원(SRMQ)은 지속가능한 사회 구현에 초점을 맞추고 있습니다. ESG와 경영품질의 최고 전문가로 구성된 사경원은 다음과 같은 다섯 가지 목표를 향해 뜻을 모으고 있습니다.
          </p>
          <p className="greeting-desc">
            ● 산업별 ESG 및 품질 전문가를 초빙하여 현업 문제 해결을 지원한다. <br/>
            ● K-AI STATION에 기반하여 AI 교육 훈련 테스트 플랫폼을 제공한다. <br/>
            ● 대학 전문가와 현업 전문가의 B&B_Bridge&Blend 파트너십을 중시한다.<br/>
            ● 한국적 지속가능 및 ESG 성공모델을 글로벌 차원으로 전파한다.<br/>
            ● 양극화 해소를 위한 BP를 공유하여 신뢰사회 구축에 기여한다.<br/>
            <br/>
            <br/>
            작고 소소한, 그러나 따뜻한 마음의 자기 책임감(Self Responsibility)이 신뢰 사회의 소중한 자산입니다. <br/>퀄리티_Quality 사회를 목표로 나아가는 전문가의 동참을 청합니다.  
          </p>
        </div>
      </div>

      <div className="greeting-footer-content">
        <div className="greeting-author">
          <span className="author-org">(사)사회적책임경영품질원</span>
          <span className="author-name">회장 신완선</span>
        </div>
      </div>

      <div className="greeting-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>02</span>
      </div>

    </div>
  );
}