import React from 'react';
import coverImg from '../../assets/bookviewer.png';
import './CoverPage.css';
export default function CoverPage() {
  return (
    <div className="cover-container">
      <div className="cover-header">
        <h1 className="cover-title">
          사회책임경영품질원
        </h1>
        <p className="cover-subtitle">
          Social Responsibility & Management Quality Institute
        </p>
        <p className="cover-desc">
          기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
        </p>
      </div>

      <div className="cover-image-wrapper">
        <img 
          src={coverImg} 
          alt="표지 이미지" 
        />
      </div>

      <div className="cover-footer">
        <span>기획재정부 승인 비영리법인</span>
        <span>www.srmq.or.kr</span>
      </div>

    </div>
  );
}