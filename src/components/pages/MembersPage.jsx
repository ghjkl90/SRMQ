import React from 'react';
import './MembersPage.css';

export default function MemberPage() {
  return (
    <div className="member-container">
      
      <div className="member-content-wrap">
        
        {/* 상단 헤더 및 타이틀 */}
        <div className="member-header">
          <div className="member-badge-box">
            <span className="badge-kr">회원 안내</span>
            <span className="badge-en">MEMBERSHIP</span>
          </div>
          <h2 className="member-title">회원 안내</h2>
          <p className="member-desc">
            본원은 사회적책임 · 경영품질 · 안전보건경영에 관심 있는분의 회원 가입을 환영하며, 특히 산업체에 종사하는 분들의 참여를 적극 권장합니다. 회원가입은 본원 홈페이지(www.srmq.or.kr)에서 가능합니다.
          </p>
        </div>

        {/* 1. 일반 회원 섹션 */}
        <div className="member-section-box">
          <h3 className="section-title">일반 회원</h3>
          <ul className="member-list">
            <li>총회 참석 및 의결권 부여 (정회원 · 준회원에 한함)</li>
            <li>본원 산하 분과 · 연구회 등 모든 사업에 참여 가능</li>
            <li>본원 소식 및 행사정보 이메일 수신</li>
          </ul>

          <table className="member-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>입회비 (원)</th>
                <th>연회비 (원)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>준회원</td>
                <td>50,000</td>
                <td>-</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>정회원</td>
                <td>100,000</td>
                <td>50,000</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>종신회원</td>
                <td>500,000</td>
                <td>-</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>단체회원</td>
                <td>-</td>
                <td>100,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. 기업 회원 섹션 */}
        <div className="member-section-box">
          <h3 className="section-title">기업 회원</h3>
          
          <div className="corporate-cards-grid">
            
            {/* 내셔널 ESG */}
            <div className="corp-card">
              <div className="corp-card-header">
                <span className="corp-name">내셔널 ESG</span>
                <span className="corp-badge">NES</span>
              </div>
              <div className="corp-fee">연회비 2,000,000원</div>
              <ul className="member-list">
                <li>우수사례 연 1회 공유</li>
                <li>컨벤션 연 2명 참석제공</li>
                <li>K-AI 그린벨트 2명 교육</li>
              </ul>
            </div>

            {/* 베스트 ESG */}
            <div className="corp-card">
              <div className="corp-card-header">
                <span className="corp-name">베스트 ESG</span>
                <span className="corp-badge">BES</span>
              </div>
              <div className="corp-fee">연회비 3,000,000원</div>
              <ul className="member-list">
                <li>우수사례 연 2회 공유</li>
                <li>컨벤션 연 1회 홍보</li>
                <li>컨벤션 연 3명 참석 제공</li>
                <li>K-AI 그린벨트 1명 + 블랙벨트 1명 교육</li>
              </ul>
            </div>

            {/* 글로벌 ESG */}
            <div className="corp-card">
              <div className="corp-card-header">
                <span className="corp-name">글로벌 ESG</span>
                <span className="corp-badge blue">GES</span>
              </div>
              <div className="corp-fee">연회비 5,000,000원</div>
              <ul className="member-list">
                <li>국내·국제 간행물 발송</li>
                <li>컨벤션 연 1회 홍보</li>
                <li>컨벤션 5명 이내 참석 제공</li>
                <li>K-AI 그린벨트 2명 + 블랙벨트 2명 교육</li>
              </ul>
            </div>

          </div>
        </div>

        {/* 3. 특별 회원 섹션 */}
        <div className="member-section-box special-box">
          <h3 className="section-title">특별 회원</h3>
          <div className="special-fee">연회비 10,000,000원</div>
          <ul className="member-list">
            <li>기업회원 중 글로벌 ESG(GES)과 동일한 혜택 제공</li>
            <li>특별회원 후원금은 본원 발전을 위해 사용하며, 사용용도를 지정할 수 있음</li>
            <li>ANQ (아시아품질네트워크) 사례발표 및 우수사례 (AREQP) 포상 지원</li>
          </ul>
        </div>

      </div>

      {/* 최하단 바 */}
      <div className="member-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>08</span>
      </div>

    </div>
  );
}