import React from 'react';
import visionImg from '../../assets/VisionPage.png';
import './VisionPage.css';

export default function VisionPage() {
  return (
    <div className="vision-container">
      
      {/* 상단: 배지, 이미지, 서두 텍스트, 구분선 */}
      <div className="vision-header">
        <div className="vision-badge-box">
          <span className="badge-kr">비전·핵심가치</span>
          <span className="badge-en">VISION & CORE VALUES</span>
        </div>

        <div className="vision-image-wrapper">
          <img src={visionImg} alt="비전 및 핵심가치 이미지" />
        </div>

        <p className="vision-intro-text">
          사회책임경영품질원은 기업과 조직이 신뢰와 존중을 바탕으로 글로벌 경쟁력을 향상하고 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급하는 것을 핵심 비전으로 삼습니다.
        </p>

        <div className="vision-divider"></div>

        {/* 중앙: 1, 2, 3 핵심 가치 리스트 */}
        <div className="vision-list">
          
          <div className="vision-item">
            <span className="vision-number num-green">1</span>
            <div className="vision-text-content">
              <h3 className="vision-item-title">사회적 가치 실현</h3>
              <p className="vision-item-desc">국제 사회가 정한 사회적 책임(SR) 원칙을 바탕으로, 조직의 경제적 성장뿐만 아니라 사회적·환경적 책임을 동시에 추구합니다.</p>
            </div>
          </div>

          <div className="vision-item">
            <span className="vision-number num-green">2</span>
            <div className="vision-text-content">
              <h3 className="vision-item-title">지속가능한 개발 기여</h3>
              <p className="vision-item-desc">ESG(환경·사회·지배구조) 경영 및 안전보건경영 체계를 확립하여 조직의 지속가능성 기반을 구축하도록 돕습니다.</p>
            </div>
          </div>

          <div className="vision-item">
            <span className="vision-number num-blue">3</span>
            <div className="vision-text-content">
              <h3 className="vision-item-title">평가 및 우수사례 확산</h3>
              <p className="vision-item-desc">바람직한 경영모델 및 평가지표(사회책임 지수·ESG 지수 등)를 개발·보급하고, 이를 실천하는 우수한 조직을 발굴하여 포상합니다.</p>
            </div>
          </div>

        </div>
      </div>

      {/* 최하단 바 */}
      <div className="vision-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>03</span>
      </div>

    </div>
  );
}