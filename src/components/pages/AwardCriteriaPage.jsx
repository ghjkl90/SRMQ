import React from 'react';
import './SubpageLayout.css';
import './AwardCriteriaPage.css';

const FIELDS = [
  {
    tone: 'green', title: 'SR 분야', mark: 'S', codes: ['S', 'R'],
    desc: 'ISO 26000 7대 핵심의제에 기반한 포용적 경영실천 평가',
    items: ['인권·노사협력부문', '동반성장·상생협력부문', '윤리경영·부패방지부문', '소비자보호·공정운영부문', '지역사회 발전·공헌부문'],
  },
  {
    tone: 'teal', title: 'MQ 분야', mark: 'M', codes: ['M', 'Q'],
    desc: '말콤 볼드리지 모델 및 글로벌 품질경영 혁신활동 검증',
    items: ['경영혁신부문', '기술혁신부문', '품질혁신부문', '제품혁신부문', '서비스혁신부문'],
  },
  {
    tone: 'cyan', title: 'ESG경영 분야', mark: 'E', codes: ['E', 'S', 'G'],
    desc: 'K-ESG 가이드라인 기반 지속가능 실행체계 종합 진단',
    items: ['환경(Environment) 부문', '사회(Social) 부문', '지배구조(Governance) 부문', '공급망 ESG 관리 부문', '탄소중립·녹색경영 부문'],
  },
  {
    tone: 'blue', title: '안전보건경영 분야', mark: 'H', codes: ['S', 'H'],
    desc: '중대재해처벌법 및 ISO 45001 기준 체계적 안전문화 실현',
    items: ['안전보건경영 부문', '산업안전보건 예방체계 부문', '중대재해 무사고 실천 부문', '근로자 건강증진 프로그램 부문', '협력사 안전공생 협력 부문'],
  },
];

const SCORES = [
  { label: '대기업', score: '700점' },
  { label: '중견기업', score: '600점' },
  { label: '중소기업', score: '500점' },
];

const BENEFITS = [
  '1. 명예의 전당 영구 헌정패 증정',
  '2. 정부포상 및 유공자상 우선 추천',
  '3. 사경원 주관 진단·지도·교육비 감면',
];

const CONTACTS = [
  { label: '주관기관', value: '(사)사회적책임경영품질원 포상사무국' },
  { label: '전화문의', value: '02-2025-9171 ~ 2' },
  { label: '이메일 접수', value: 'srmq@srmq.or.kr', href: 'mailto:srmq@srmq.or.kr' },
  { label: '홈페이지', value: 'www.srmq.or.kr', href: 'https://www.srmq.or.kr', accent: true },
];

const AwardCriteriaPage = () => {
  return (
    <div className="subpage-container crit-page">
      <div className="subpage-content">

        {/* 상단 타이틀 영역 (SubpageLayout.css 공통) */}
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">포상제도</span>
            <span className="subpage-badge-en">AWARD CRITERIA & CLASSES</span>
          </div>
          <h1 className="subpage-title">분야별 응모 및 시상 기준</h1>
        </header>

        {/* 4대 시상분야 카드 */}
        <div className="crit-field-grid">
          {FIELDS.map((f) => (
            <div className={`crit-field-card ${f.tone}`} key={f.title}>
              <div className="crit-field-head">
                <h3 className="crit-field-title">{f.title}</h3>
                <span className="crit-mark">{f.mark}</span>
              </div>
              <p className="crit-field-desc">{f.desc}</p>
              <ul className="crit-dot-list">
                {f.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
              <div className="crit-code-row">
                {f.codes.map((c, i) => <span className="crit-mark" key={i}>{c}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* 05. 유공자 분야 */}
        <div className="crit-merit-card">
          <div className="crit-merit-head">
            <span className="crit-pill blue">05. 유공자 포상</span>
            <h2 className="crit-merit-title">유공자 분야 (개인 포상)</h2>
          </div>

          <div className="crit-merit-grid">
            <div className="crit-info-box">
              <span className="crit-info-label">응모 대상</span>
              <strong className="crit-info-title">CEO 및 유공 임원·관리자</strong>
              <p className="crit-info-desc">
                영리·비영리, 업종 및 규모 무관. 사회적책임경영(SR) 및 경영품질(MQ) 혁신 추진에 탁월한 공헌을 한 리더 및 실무 책임자
              </p>
            </div>

            <div className="crit-info-box">
              <span className="crit-info-label">제출 서류</span>
              <strong className="crit-info-title">신청서 및 공적서</strong>
              <ul className="crit-dot-list">
                <li>유공자 포상 신청서 (별첨 서식)</li>
                <li>개인 공적서 (접수 후 사무국 양식 안내)</li>
              </ul>
            </div>

            <div className="crit-info-box">
              <span className="crit-info-label">시상 훈격 및 기준</span>
              <div className="crit-class-item">
                <strong className="crit-info-title">국가최고경영자대상</strong>
                <p className="crit-info-desc">기획재정부 장관 승인 (최고경영자 대상)</p>
              </div>
              <div className="crit-class-item divider">
                <strong className="crit-info-title">SRMQ 최고경영자상 / 유공자상</strong>
                <p className="crit-info-desc">사경원 회장 승인 (경영자 및 임직원 대상)</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단: 명예의 전당 + 사무국 안내 */}
        <div className="crit-bottom-grid">
          <div className="crit-hall-panel">
            <span className="crit-pill blue">헌정 취지</span>
            <h2 className="crit-hall-title">최고 권위의 영예, SRMQ 명예의 전당</h2>
            <p className="crit-hall-desc">
              다수·연속 수상을 통해 사회적책임경영 및 경영품질 혁신 분야에서 탁월한 국가적 성과를 입증한 모범 기업을 선정하여 영구 헌정합니다.
            </p>
            <p className="crit-hall-note">(매년 11월 컨벤션 헌정식)</p>

            <div className="crit-score-row">
              {SCORES.map((s) => (
                <div className="crit-score-box" key={s.label}>
                  <span className="crit-score-label">{s.label}</span>
                  <strong className="crit-score-value">{s.score}</strong>
                  <span className="crit-score-sub">7년 이내 누적</span>
                </div>
              ))}
            </div>

            <div className="crit-benefit-wrap">
              <strong className="crit-benefit-title">헌정 기업 주요 특전</strong>
              <div className="crit-benefit-row">
                {BENEFITS.map((b) => <span className="crit-chip" key={b}>{b}</span>)}
              </div>
            </div>
          </div>

          <div className="crit-contact-card">
            <span className="crit-chip gray">신청 및 서류제출처</span>
            <h2 className="crit-contact-title">포상 운영사무국 안내</h2>
            <dl className="crit-contact-list">
              {CONTACTS.map((c) => (
                <div className="crit-contact-item" key={c.label}>
                  <dt>{c.label}</dt>
                  <dd className={c.accent ? 'accent' : ''}>
                    {c.href ? <a href={c.href} target={c.accent ? '_blank' : undefined} rel="noreferrer">{c.value}</a> : c.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

      </div>

      {/* 최하단 바 */}
      <footer className="subpage-bottom-bar">
        <span>© National Awards & Quality Management Convention. All rights reserved.</span>
        <span>Award Criteria & Classes</span>
      </footer>
    </div>
  );
};

export default AwardCriteriaPage;
