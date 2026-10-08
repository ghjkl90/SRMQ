import React from 'react';
import './SubpageLayout.css';
import './CiPage.css';
import ciInfoImage from '../../assets/ci_infor.jpg';

const CiPage = () => {
  return (
    <div className="subpage-container">
      <div className="subpage-content">

        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">기관소개</span>
            <span className="subpage-badge-en">ABOUT &amp; CI</span>
          </div>
          <h1 className="subpage-title">CI 소개</h1>
          <p className="subpage-desc">
            사회적책임경영품질원(SRMQ)의 아이덴티티와 심벌마크의 의미를 안내합니다.
          </p>
        </header>


        <div className="ci-info-img-wrapper">
          <img src={ciInfoImage} alt="사회적책임경영품질원 CI 소개 인포그래픽" />
        </div>

      </div>


      <footer className="subpage-bottom-bar">
        <span>사회적책임경영품질원 (SRMQ)</span>
        <span>Corporate Identity Guide</span>
      </footer>
    </div>
  );
};

export default CiPage;
