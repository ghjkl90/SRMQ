import React from 'react';
import './Location.css';

export default function LocationPage() {
  return (
    <div className="location-container">
      <div className="location-content-wrap">
        <div className="location-header">
          {/* 1. 뱃지 */}
          <div className="location-badge-box">
            <span className="badge-kr">기관소개</span>
            <span className="badge-en">LOCATION</span>
          </div>

          <h1 className="location-title">오시는 길</h1>

          <p className="location-desc">
            사회적책임경영품질원 찾아오시는 길과 위치 정보를 안내해 드립니다.
          </p>
        </div>

        <div className="location-map-wrapper">
          <iframe
            title="Google Map Location"
            src="https://maps.google.com/maps?q=서울특별시%20송파구%20거여동%20568-1&t=&z=17&ie=UTF8&iwloc=&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* 하단 바 */}
      <div className="location-bottom-bar">
        <span>서울특별시 송파구 거여동 568-1</span>
        <span>Tel: 02-000-0000</span>
      </div>
    </div>
  );
}