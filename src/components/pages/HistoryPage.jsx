import React from 'react';
import './HistoryPage.css';

const images = import.meta.glob('../../assets/*.{png,jpg,jpeg}', { eager: true });

const getImgSrc = (fileName) => {
  const match = Object.keys(images).find((path) => path.endsWith(`/${fileName}`));
  return match ? images[match].default : '';
};

export default function HistoryPage() {
  return (
    <div className="history-container">
      
      <div className="history-content-wrap">
        
        {/* 상단 타이틀 영역 (다른 페이지와 동일한 규격) */}
        <div className="history-header">
          <div className="history-badge-box">
            <span className="badge-kr">기관안내</span>
            <span className="badge-en">ABOUT & CONTACT</span>
          </div>
          <h2 className="history-title">연혁 & 네트워크</h2>
        </div>

        {/* 상단 대형 이미지 및 연혁 카드 영역 */}
        <div className="history-image-wrapper">
          <img src={getImgSrc('HistoryPage.png')} alt="연혁 및 네트워크 배경" />
          <div className="history-image-overlay"></div>

          {/* 반투명 연혁 정보 카드 */}
          <div className="history-card-overlay">
            <h3 className="history-card-title">산업계 · 공공기관 · 연구기관 · 학계 전문가 네트워크 운영</h3>
            
            <div className="history-timeline">
              <div className="timeline-item">
                <span className="timeline-date">2002. 01</span>
                <span className="timeline-desc">신품질포럼 창립</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-date">2002. 11</span>
                <span className="timeline-desc">제1회 신품질포럼 개최</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-date">2013. 01</span>
                <span className="timeline-desc">(사)사회적책임경영품질원 설립 · 기획재정부 승인 비영리법인</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-date">정기 개최</span>
                <span className="timeline-desc">사회적책임경영품질 컨벤션 - 국가경영대상 · SRMQ상 시상</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-date">상시 운영</span>
                <span className="timeline-desc">진단·평가, ESG·지속가능경영 교육, 정책연구·출판 사업</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 CONTACT 섹션 */}
        <div className="contact-section">
          <h3 className="contact-section-title">CONTACT</h3>
          <div className="contact-grid">
            <div className="contact-row">
              <span className="contact-label">홈페이지</span>
              <span className="contact-value">www.srmq.or.kr</span>
            </div>
            <div className="contact-row">
              <span className="contact-label">주소</span>
              <span className="contact-value">(05773) 서울특별시 송파구 양산로 8길 5-12, B01호</span>
            </div>
            <div className="contact-row">
              <span className="contact-label">전화 · 이메일</span>
              <span className="contact-value">02-408-9171 · srmq@srmq.or.kr</span>
            </div>
            <div className="contact-row">
              <span className="contact-label">후원계좌 (연회비)</span>
              <span className="contact-value">KB국민은행 821301-00-058360 · 예금주 (사)사회적책임경영품질원</span>
            </div>
            <div className="contact-row">
              <span className="contact-label">후원계좌 (기부금)</span>
              <span className="contact-value">KB국민은행 821301-00-058386 · 예금주 (사)사회적책임경영품질원</span>
            </div>
          </div>
        </div>

      </div>

      {/* 최하단 바 */}
      <div className="history-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>11</span>
      </div>

    </div>
  );
}