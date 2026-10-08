import React from 'react';
import './SubpageLayout.css';
import './AwardProcessPage.css';
// 배너 이미지 경로는 프로젝트에 맞게 바꿔주세요.
import bannerImg from '../../assets/award-banner.jpg';

const STEPS = [
  { tag: '공고', tone: 'green', title: '포상 응모 공고', desc: '매년 1월 일간지 및 사경원 홈페이지를 통한 연간 포상 계획 공고' },
  { tag: '접수', tone: 'teal', title: '응모신청서 접수', desc: '참가신청서 및 사전 기초자료 제출 (사경원 지정 소정 양식)' },
  { tag: '서류제출', tone: 'cyan', title: '현황설명서·공적서 제출', desc: '부문별 경영활동 실적 및 세부 공적서 제출 (필요시 서류보완 요청)' },
  { tag: '심사', tone: 'blue', title: '평가위원회 구성 및 심사', desc: '학계·전문가 심사위원단에 의한 객관적 서류평가 및 현장 방문 실사' },
  { tag: '보고', tone: 'green', title: '평가결과보고서 검토', desc: '심의위원회 심의, 종합 진단 피드백 보고서 종합 취합 및 보완' },
  { tag: '추천', tone: 'teal', title: '포상추천 심의 및 상신', desc: '기획재정부 장관포상 대상 후보 기업 심의 및 공식 추천 상신' },
  { tag: '확정', tone: 'cyan', title: '정부 승인 및 확정 통보', desc: '기획재정부 최종 공적심사 승인 및 사경원 회장 수상 기업 확정 공지' },
  { tag: '시상식', tone: 'blue', title: '시상 (SRMQ컨벤션)', desc: '매년 11월 전국 컨벤션 행사서 상패 수여식 및 우수사례 발표회 진행' },
];

const AwardProcessPage = () => {
  return (
    <div className="subpage-container">
      <div className="subpage-content">
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">포상제도</span>
            <span className="subpage-badge-en">STEP-BY-STEP GUIDE</span>
          </div>
          <h1 className="subpage-title">포상 심사 및 운영 절차</h1>
          <p className="subpage-desc">
            사회적책임경영품질 컨벤션에서 매년 시상하는 대한민국 대표 경영품질 포상
          </p>
        </header>

        {/* 배너 이미지 */}
        <div className="proc-banner">
          <img src={bannerImg} alt="포상 트로피" />
        </div>

        {/* 절차 카드 4 x 2 */}
        <div className="proc-grid">
          {STEPS.map((step) => (
            <div className="proc-card" key={step.title}>
              <span className={`proc-tag ${step.tone}`}>{step.tag}</span>
              <h3 className="proc-title">{step.title}</h3>
              <p className="proc-desc">{step.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* 최하단 바 */}
      <footer className="subpage-bottom-bar">
        <span>© National Awards & Quality Management Convention. All rights reserved.</span>
        <span>Award Process Guide</span>
      </footer>
    </div>
  );
};

export default AwardProcessPage;
