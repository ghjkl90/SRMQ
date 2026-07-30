import React from 'react';
import './OrgPage.css';

const images = import.meta.glob('../../assets/*.{png,jpg,jpeg}', { eager: true });

const getImgSrc = (fileName) => {
  const match = Object.keys(images).find((path) => path.endsWith(`/${fileName}`));
  return match ? images[match].default : '';
};

export default function OrgPage() {
  return (
    <div className="org-container">

      <div className="org-content-wrap">
        
        {/* 상단 타이틀 영역 (다른 페이지와 동일한 규격) */}
        <div className="org-header">
          <div className="org-badge-box">
            <span className="badge-kr">기관안내</span>
            <span className="badge-en">ABOUT & CONTACT</span>
          </div>
          <h2 className="org-main-title">기관안내</h2>
        </div>

        {/* 1. SRMQ 조직 구조 섹션 */}
        <h3 className="org-section-title">SRMQ 조직 구조</h3>
        <div className="org-image-wrapper">
          <img src={getImgSrc('org_structure.png')} alt="SRMQ 조직 구조도 배경" />
          <div className="org-image-overlay"></div>

          {/* 조직도 다이어그램 노드 레이어 */}
          <div className="org-tree-container">
            <div className="org-row">
              <div className="org-node">자문회장단</div>
              <div className="org-node main">명예회장</div>
              <div className="org-node">이사회</div>
            </div>
            <div className="org-row">
              <div className="org-node highlight">회장</div>
            </div>
            <div className="org-row">
              <div className="org-node highlight">원장</div>
            </div>
            <div className="org-row">
              <div className="org-node">분과위원회</div>
              <div className="org-node highlight">사무국</div>
              <div className="org-node">경영연구회</div>
            </div>
            <div className="org-row sub-row">
              <div className="org-node small">포상분과</div>
              <div className="org-node small">출판·홍보분과</div>
              <div className="org-node small">대외협력분과</div>
              <div className="org-node small">ESG 경영연구회</div>
              <div className="org-node small">사회적가치 경영연구회</div>
              <div className="org-node small">혁신성장 경영연구회</div>
            </div>
          </div>
        </div>

        {/* 2. SRMQ 역대 위원장 / 회장 섹션 */}
        <h3 className="org-section-title table-title-spacing">SRMQ 역대 위원장 / 회장</h3>
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>구분</th>
              <th style={{ width: '12%' }}>성명</th>
              <th style={{ width: '22%' }}>임기</th>
              <th style={{ width: '44%' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan="4" style={{ fontWeight: 600, backgroundColor: '#fafafa' }}>
                신품질 포럼<br />(위원장)
              </td>
              <td>조 순</td>
              <td>2002.01 ~ 2003.02</td>
              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>(전)부총리겸 경제기획원 장관</td>
            </tr>
            <tr>
              <td>오 명</td>
              <td>2003.03 ~ 2004.02</td>
              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                (전)부총리겸 과학기술부 장관<br />(전)사회적책임경영품질원 명예회장
              </td>
            </tr>
            <tr>
              <td>김기환</td>
              <td>2004.03 ~ 2007.07</td>
              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                (전)상공부 차관<br />(전)서울파이낸셜포럼 회장
              </td>
            </tr>
            <tr>
              <td>김철수</td>
              <td>2007.08 ~ 2012.11</td>
              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                (전)상공자원부 장관<br />(전)사회적책임경영품질원 명예회장
              </td>
            </tr>
            <tr>
              <td rowSpan="3" style={{ fontWeight: 600, backgroundColor: '#fafafa' }}>
                사회적책임경영품질원<br />(회장)
              </td>
              <td>김철수</td>
              <td>2012.12 ~ 2016.01</td>
              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>(전)상공자원부 장관</td>
            </tr>
            <tr>
              <td>박성현</td>
              <td>2016.02 ~ 현재</td>
              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                (전)한국과학기술한림원 원장<br />서울대학교 명예교수
              </td>
            </tr>
            <tr>
              <td>신완선</td>
              <td>2026.09.01 (예정)</td>
              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                (전)아시아품질협회 ANQ 의장<br />(전)세계품질한림원 IAQ 석학
              </td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* 최하단 바 */}
      <div className="org-bottom-bar">
        <span>사회책임경영품질원</span>
        <span>10</span>
      </div>

    </div>
  );
}