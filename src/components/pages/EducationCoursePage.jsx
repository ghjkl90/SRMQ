import React from 'react';
import './SubpageLayout.css';
import './EducationCoursePage.css';
import bannerImg from '../../assets/education-banner.jpg';


const ICONS = {
  check: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  award: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></>,
  contact: <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v2M8 2v2" /><circle cx="12" cy="11" r="3" /><path d="M7 21v-1a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>,
  gem: <><path d="M6 3h12l4 6-10 13L2 9Z" /><path d="M11 3 8 9l4 13 4-13-3-6" /><path d="M2 9h20" /></>,
  screen: <><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></>,
  user: <><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

const COURSES = [
  {
    id: 'sr',
    title: 'SR(사회적책임) 지도사 자격 과정',
    pill: '한국직업능력연구원 등록 민간자격',
    overview: [
      {
        icon: 'target', tone: 'green', title: '교육 목표',
        desc: '국제표준인 ISO 26000에 기반하여 기업 및 공공기관의 사회적가치 창출 체계를 정립하고 사회적책임 전 영역을 전문적으로 진단·지도하는 최고 실무자를 양성합니다.',
        foot: '체계적 사회적가치 실행 모델 구축',
      },
      {
        icon: 'award', tone: 'teal', title: '교육 특징',
        desc: '국내 최초 SR 지도사 민간자격 부여 과정으로, 이론과 현장 실습(워크숍)을 병행하여 거버넌스·인권·노동·환경 등 전 영역을 집중 포괄합니다.',
        foot: '4단계 팀 실습 (Team Activity) 중심',
      },
      {
        icon: 'contact', tone: 'blue', title: '교육 대상',
        desc: '기업·기관의 ESG, 사회공헌, 경영혁신, 감사 부서 관리자 및 실무 책임자, KAR 등록 유관 심사원(부패방지, BCMS 등), 전문 컨설팅 실무 종사자.',
        foot: '※ 유관 실무 경력 3년 이상 우대', footNote: true,
      },
    ],
    requirements: [
      { label: '학력 요건', value: '4년제 대학 졸업 이상 (또는 동등 이상의 유관 경력 보유자)' },
      { label: '직무 경력', value: '경영기획, 지속가능경영, 품질, 윤리 등 유관부서 3년 이상 경력자' },
      { label: '수료 기준', value: '출석률 90% 이상, 실습과제 100% 제출, 필기시험 70점 이상', strong: true },
    ],
    benefits: [
      "사단법인 사회적책임경영품질원 공인 'SR지도사' 자격증 발급",
      '사경원 전문위원 등록 및 국가포상/진단평가 심사위원 위촉 우선 기회',
      '한국인정지원센터(KAR) 심사원 지속적 전문기술개발(CPD) 경력시간 인정',
    ],
    moduleLabel: '교육 모듈 및 세부 교과목',
    activityLabel: '실습 및 활동',
    schedule: [
      {
        day: '1일차',
        sessions: [
          { time: '09:30 - 13:00', hours: '3.5H', title: '사회적책임(SR) 개요 및 글로벌 동향', detail: '국제표준 ISO 26000 제정 배경 및 7대 핵심원칙 이해, 글로벌 규제 프레임워크 비교', activity: '기본 강의', tone: 'gray' },
          { time: '14:00 - 17:30', hours: '3.5H', title: 'ISO 26000 7대 핵심주제별 실행요건 분석', detail: '조직 거버넌스, 인권, 노동관행, 환경, 공정운영관행, 소비자 이슈, 지역사회 참여', activity: 'Team Activity 1: 갭분석', tone: 'lime' },
        ],
      },
      {
        day: '2일차',
        sessions: [
          { time: '09:30 - 13:00', hours: '3.5H', title: 'SR 평가기준 및 사회적가치 성과측정 모델', detail: '사경원 SRMQ 평가모델 분석, ESG 연계 지표, K-ESG 가이드라인 비교 분석', activity: 'Team Activity 2: 지표설계', tone: 'lime' },
          { time: '14:00 - 17:30', hours: '3.5H', title: '사회적책임 경영진단 및 지도 기법', detail: '진단 프로세스 수립, 리스크 평가 매트릭스 도출 및 컨설팅 리포트 작성 실무', activity: 'Team Activity 3: 모의진단', tone: 'lime' },
        ],
      },
      {
        day: '3일차',
        sessions: [
          { time: '09:30 - 13:00', hours: '3.5H', title: '지속가능경영보고서 작성실무 및 중대성 평가', detail: 'GRI Standards 기반 이중 중대성(Double Materiality) 평가 실습 및 공시 가이드', activity: 'Team Activity 4: 보고서기획', tone: 'lime' },
          { time: '14:00 - 16:30', hours: '2.5H', title: '자격검정 필기평가 및 종합 피드백, 수료식', detail: 'SR지도사 자격시험 (객관식 및 주관식 서술), 총평 및 자격 인증 수여', activity: '자격시험 및 수료', tone: 'teal' },
        ],
      },
    ],
    note: '총 3일간 20시간 / 정원 20명 내외 (소수 정예 실습형)',
  },
  {
    id: 'esg',
    title: 'ESG 경영전략 핵심 실무 과정',
    pill: '월간 정기 개설',
    overview: [
      {
        icon: 'flag', tone: 'green', title: '교육 목표',
        desc: '조직의 지속가능성장을 견인하기 위한 ESG 전략 수립 및 실천 프로세스를 체계화하고, GRI·ISO 표준 기반의 실질적 대응 역량을 배양합니다.',
        foot: '공시 대응 즉각 활용 실무 중심',
      },
      {
        icon: 'gem', tone: 'teal', title: '교육 특징',
        desc: 'ESG 본질부터 전략수립, 성과공시(보고서 작성), 국내외 평가 대응까지 원스톱 학습. CSR, CSV, UN SDGs와의 연계성을 명쾌하게 해석합니다.',
        foot: '산업계 최고 전문 실무 강사진',
      },
      {
        icon: 'screen', tone: 'blue', title: '수료 혜택',
        desc: '(사)사회적책임경영품질원장 명의 공식 수료증 발급, 사경원 ESG 및 지속가능경영 정기 세미나 초청권 부여, 전문가 네트워크 교류.',
        foot: '지속적인 최신 정책 가이드 제공',
      },
    ],
    moduleLabel: '교육 모듈 및 상세 내용',
    activityLabel: '교육 형태',
    schedule: [
      {
        day: '1일차',
        sessions: [
          { time: '10:00 - 12:00', hours: '2H', title: '등록 및 ESG 경영의 본질과 패러다임 변화', detail: '글로벌 공급망 규제(CBAM, CSDD), 기업가치와 비재무적 성과와의 상관관계 분석', activity: '강의 & 토론', tone: 'gray' },
          { time: '13:00 - 18:00', hours: '5H', title: 'ESG 실행 전략 수립 (환경·사회·지배구조)', detail: '탄소중립 Scope 1·2·3 산정, 인권영향평가, 중대재해 안전보건, 이사회 거버넌스 및 컴플라이언스', activity: '심화 강의', tone: 'lime' },
        ],
      },
      {
        day: '2일차',
        sessions: [
          { time: '09:30 - 11:30', hours: '2H', title: '국내외 ESG 평가 및 우수기업 사례 분석', detail: 'KCGS, 서스틴베스트, MSCI, S&P Global 평가체계 핵심 대비전략', activity: '사례 분석', tone: 'gray' },
          { time: '11:30 - 13:00', hours: '1.5H', title: 'ESG 거버넌스 고도화 및 발전전략', detail: 'ESG 위원회 운영 기법, 전사 KPI 연계 방안 및 리스크 관리 체계 내재화', activity: '전략 강의', tone: 'gray' },
          { time: '14:00 - 17:00', hours: '3H', title: '지속가능경영보고서 작성 및 조별 워크숍 & 수료식', detail: 'GRI 가이드라인에 따른 이슈풀 도출 및 실무 작성 워크숍, 그룹별 발표 및 종합 평가', activity: '실습 및 수료', tone: 'teal' },
        ],
      },
    ],
    note: '총 2일간 12.5시간 / 매월 정기 개설 (공개과정)',
  },
];

const CUSTOM_PROGRAMS = [
  { title: '① 사회적책임(SR) 및 공공기관 평가', desc: '공공기관 사회적가치 창출 지표, 경영평가 비재무 지표 집중 컨설팅 교육' },
  { title: '② ESG 경영전략 및 공급망 실사', desc: '협력사 공급망 실사(Due Diligence), 탄소배출량 산정, EU 규제 대응' },
  { title: '③ 경영품질(MQ) 및 프로세스 혁신', desc: '말콤 볼드리지 및 국가품질상 기준에 기초한 경영 체질 개선 및 품질 전략' },
  { title: '④ 안전보건(ISO 45001) & 윤리준법', desc: '중대재해처벌법 대비 전사 안전보건체계 구축 및 반부패 컴플라이언스' },
];

const STEPS = [
  { title: '신청', desc: '온라인 접수 또는 이메일 신청서 제출' },
  { title: '서류심사', desc: '자격요건 및 실무 경력 서류 검토' },
  { title: '교육비 수납', desc: '수강 등록 확정 및 영수증/계산서 발행' },
  { title: '수강 및 평가', desc: '워크숍 실습 및 자격검정 필기시험' },
  { title: '수료 및 자격', desc: '수료증 교부 및 SR 지도사 자격 발급' },
];

/* ---------- 하위 컴포넌트 ---------- */
const SectionHead = ({ title, pill, aside }) => (
  <div className="edu-section-head">
    <h2 className="edu-section-title">{title}</h2>
    {pill && <span className="edu-pill">{pill}</span>}
    {aside && <span className="edu-section-aside">{aside}</span>}
  </div>
);

const OverviewBox = ({ items }) => (
  <div className="edu-overview">
    <div className="edu-overview-label"><Icon name="check" size={14} />교육 과정 개요</div>
    <div className="edu-overview-grid">
      {items.map((it) => (
        <div className="edu-ov-card" key={it.title}>
          <span className={`edu-ov-icon ${it.tone}`}><Icon name={it.icon} size={14} /></span>
          <h3 className="edu-ov-title">{it.title}</h3>
          <p className="edu-ov-desc">{it.desc}</p>
          <p className={`edu-ov-foot ${it.footNote ? 'note' : ''}`}>
            {it.footNote ? it.foot : `✓ ${it.foot}`}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const ScheduleTable = ({ course }) => (
  <div className="edu-table-wrap">
    <table className="edu-table">
      <colgroup>
        <col className="col-day" />
        <col className="col-time" />
        <col />
        <col className="col-act" />
      </colgroup>
      <thead>
        <tr>
          <th>일정</th>
          <th>시간</th>
          <th className="left">{course.moduleLabel}</th>
          <th>{course.activityLabel}</th>
        </tr>
      </thead>
      <tbody>
        {course.schedule.map((d) => (
          <React.Fragment key={d.day}>
            {d.sessions.map((s, i) => (
              <tr key={s.time}>
                {i === 0 && <td className="edu-day" rowSpan={d.sessions.length}>{d.day}</td>}
                <td className="edu-time">{s.time}<br />({s.hours})</td>
                <td className="edu-module">
                  <strong>{s.title}</strong>
                  <span>{s.detail}</span>
                </td>
                <td className="edu-act"><span className={`edu-tag ${s.tone}`}>{s.activity}</span></td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

/* ---------- 페이지 ---------- */
const EducationCoursePage = () => {
  return (
    <div className="subpage-container edu-page">
      <div className="subpage-content">

        {/* 상단 타이틀 영역 (SubpageLayout.css 공통) */}
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">교육안내</span>
            <span className="subpage-badge-en">EDUCATION & TRAINING</span>
          </div>
          <h1 className="subpage-title">교육과정 안내</h1>
          <p className="subpage-desc">
            사회적책임(SR)과 ESG 경영을 선도할 국내 최고 수준의 핵심 실무 전문가를 양성합니다.
          </p>
        </header>

        <div className="edu-banner">
          <img src={bannerImg} alt="교육과정 안내" />
        </div>

        {/* SR / ESG 과정 */}
        {COURSES.map((c) => (
          <section className={`edu-section edu-course ${c.id}`} key={c.id}>
            <SectionHead title={c.title} pill={c.pill} />
            <OverviewBox items={c.overview} />

            {c.requirements && (
              <div className="edu-req-grid">
                <div className="edu-req-box">
                  <h3 className="edu-box-title"><Icon name="user" size={15} />자격 승인 요건</h3>
                  <dl className="edu-req-list">
                    {c.requirements.map((r) => (
                      <div className="edu-req-row" key={r.label}>
                        <dt>{r.label}</dt>
                        <dd className={r.strong ? 'strong' : ''}>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="edu-req-box">
                  <h3 className="edu-box-title"><Icon name="trophy" size={15} />수료 및 합격 특전</h3>
                  <ul className="edu-dot-list">
                    {c.benefits.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </div>
              </div>
            )}

            <ScheduleTable course={c} />
            <p className="edu-table-note">{c.note}</p>
          </section>
        ))}

        {/* 맞춤형 위탁교육 */}
        <section className="edu-section">
          <SectionHead title="기업 및 기관 맞춤형 위탁교육" />
          <div className="edu-custom">
            <div className="edu-custom-main">
              <h3 className="edu-custom-title">조직 맞춤형 인하우스 교육 솔루션</h3>
              <p className="edu-custom-desc">
                사경원의 풍부한 진단·평가 노하우를 바탕으로, 고객 조직의 업종(제조, 금융, 공공 등), 경영 현안 및 임직원 직급별 요구 역량을 정밀 분석하여 최적화된 커리큘럼을 현장 맞춤형으로 설계·제공합니다.
              </p>
              <div className="edu-custom-grid">
                {CUSTOM_PROGRAMS.map((p) => (
                  <div className="edu-custom-card" key={p.title}>
                    <strong>{p.title}</strong>
                    <span>{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="edu-contact-card">
              <div className="edu-contact-head">
                <h3>맞춤교육 상담 및 접수</h3>
                <span className="edu-soft-pill">상시 운영</span>
              </div>
              <p className="edu-contact-desc">
                기관의 세부 교육 희망일정 및 인원을 알려주시면 전담 교수진과의 검토 후 맞춤 제안서를 송부해 드립니다.
              </p>
              <dl className="edu-contact-list">
                <div><dt>전화 :</dt><dd className="mono strong">02-2025-9171~2</dd></div>
                <div><dt>팩스 :</dt><dd className="mono">02-2025-9179</dd></div>
                <div><dt>이메일 :</dt><dd className="accent"><a href="mailto:srmq@srmq.or.kr">srmq@srmq.or.kr</a></dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* 신청 및 수료 절차 */}
        <section className="edu-section">
          <SectionHead title="교육 신청 및 수료 절차" aside="신청부터 자격 승인까지 원스톱 프로세스" />
          <ol className="edu-steps">
            {STEPS.map((s, i) => (
              <li className="edu-step" key={s.title}>
                <span className={`edu-step-num s${i + 1}`}>{i + 1}</span>
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </li>
            ))}
          </ol>
        </section>

      </div>

      {/* 최하단 바 */}
      <footer className="subpage-bottom-bar">
        <span>© National Awards & Quality Management Convention. All rights reserved.</span>
        <span>Education & Training</span>
      </footer>
    </div>
  );
};

export default EducationCoursePage;
