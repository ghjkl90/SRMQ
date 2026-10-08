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
          사회적책임경영품질원은 기업과 조직이 신뢰와 존중을 바탕으로 글로벌 경쟁력을 향상하고 지속가능한 발전을 이룰 수 있도록, 사회적책임과 선진 경영문화를 널리 보급하는 것을 미션으로 삼습니다. 사경원의 3대 핵심가치는 '신뢰 사회'  ·  '책임 경영' · '글로벌 선도' 입니다.
        </p>

        <div className="vision-divider"></div>

        <div className="vision-list">
          
          <div className="vision-item">
            <span className="vision-number num-green">1</span>
            <div className="vision-text-content">
              <h3 className="vision-item-title">신뢰 사회</h3>
              <p className="vision-item-desc">사회적 격차 해소로 신뢰 사회 구축</p>
            </div>
          </div>

          <div className="vision-item">
            <span className="vision-number num-green">2</span>
            <div className="vision-text-content">
              <h3 className="vision-item-title">책임 경영</h3>
              <p className="vision-item-desc">AX 시대를 선도할 인성과 책임성 역할모델 발굴</p>
            </div>
          </div>

          <div className="vision-item">
            <span className="vision-number num-blue">3</span>
            <div className="vision-text-content">
              <h3 className="vision-item-title">글로벌 선도</h3>
              <p className="vision-item-desc">K-AI Station에 기반한 글로벌 지식 공유</p>
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