import React from 'react';
import futureImg1 from '../../assets/future1.png';
import futureImg2 from '../../assets/future2.png';
import './FuturePage.css';

export default function FuturePage() {
  return (
    <div className="future-container">
      
      <div className="future-content-wrap">
        
        {/* 상단 헤더 및 발전방향 소개 */}
        <div className="future-header">
          <div className="future-badge-box">
            <span className="badge-kr">발전방향</span>
            <span className="badge-en">FUTURE DIRECTION</span>
          </div>
          <h2 className="future-title">발전방향</h2>
          <p className="future-desc">
            ESG 공시가 제도화되는 전환기, 의무 대상 대기업을 넘어 공급망 · 중소·중견 · 공공기관으로 지속가능성경영 요구가 확산되고 있습니다. <br/> SRMQ는 준비하는 모든 조직의 신뢰받는 길잡이로서, 지속가능경영의 국가 표준 플랫폼을 지향합니다.
          </p>
        </div>

        {/* 1920x1080 화면에 꽉 차는 카드형 교차 레이아웃 */}
        <div className="future-grid-section">
          
          {/* 1행 카드: [좌측: 전략 01, 02 텍스트 / 우측: 사진 1] */}
          <div className="future-row-card">
            <div className="future-text-group">
              <div className="strategy-item">
                <span className="strategy-badge">STRATEGY 01</span>
                <h3 className="strategy-title">평가 · 인증의 표준화와 공신력 강화</h3>
                <p className="strategy-desc">
                  통합 평가지표 · 지수를 표준화하고, 국내외 공시기준(KSSB · ISSB · ISO 26000)과 정합되는 평가 · 검증 체계를 정비합니다.
                </p>
              </div>

              <div className="strategy-item">
                <span className="strategy-badge">STRATEGY 02</span>
                <h3 className="strategy-title">중소 · 중견 · 공공기관 ESG 역량 확산</h3>
                <p className="strategy-desc">
                  공급망 ESG 대응을 위한 맞춤형 진단 · 교육을 제공하고, 공공기관 ESG · 안전보건경영 평가를 확대합니다.
                </p>
              </div>
            </div>

            <div className="future-square-image-box">
              <img src={futureImg1} alt="발전방향 이미지 1" />
            </div>
          </div>

          {/* 2행 카드: [좌측: 사진 2 / 우측: 전략 03, 04 텍스트] */}
          <div className="future-row-card">
            <div className="future-square-image-box">
              <img src={futureImg2} alt="발전방향 이미지 2" />
            </div>

            <div className="future-text-group">
              <div className="strategy-item">
                <span className="strategy-badge blue-badge">STRATEGY 03</span>
                <h3 className="strategy-title">포상 · 우수사례 플랫폼 확대</h3>
                <p className="strategy-desc">
                  사회적책임경영품질 컨벤션을 국가 대표 시상 플랫폼으로 키우고, 베스트 프랙티스를 발굴·전파합니다.
                </p>
              </div>

              <div className="strategy-item">
                <span className="strategy-badge blue-badge">STRATEGY 04</span>
                <h3 className="strategy-title">정책연구 · 국제표준 · 글로벌 네트워크</h3>
                <p className="strategy-desc">
                  정부 · 유관기관 정책연구를 강화하고, 국제표준 연계와 글로벌 파트너십을 확대합니다.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 최하단 바 */}
      <div className="future-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>07</span>
      </div>

    </div>
  );
}