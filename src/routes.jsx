// src/routes.jsx
// 주소(URL) ↔ 페이지 파일 연결표. 주소를 바꾸거나 페이지를 추가할 때는 이 파일만 수정합니다.
//
// 규칙: 파일명에서 'Page'를 뺀 이름을 소문자-하이픈 형태로 씁니다.
//   GreetingPage.jsx        → 도메인/greeting
//   OperationPlanPage.jsx   → 도메인/operation-plan
//   AwardPage2.jsx          → 도메인/award2
// 예외: ProgramPage.jsx(첫 화면)는 도메인/ 이며, 도메인/program 으로 들어와도 첫 화면으로 보냅니다.
//
// 모든 페이지를 한 번에 import 하는 이유: 페이지 CSS가 서로 같은 클래스명(.badge-kr 등)을
// 공유하고 있어서, 지금처럼 전부 함께 불러와야 페이지별 모양이 기존과 똑같이 유지됩니다.

// ⚠ import 순서를 바꾸지 마세요. 기존 App.jsx 와 같은 순서여야 겹치는 클래스(.strategy-title 등)의
//   CSS 우선순위가 그대로 유지됩니다. 새 페이지는 맨 아래에 추가합니다.
import ProgramPage from './components/pages/ProgramPage';
import GreetingPage from './components/pages/GreetingPage';
import VisionPage from './components/pages/VisionPage';
import PurposePage from './components/pages/PurposePage';
import AwardPage from './components/pages/AwardPage';
import AwardPage2 from './components/pages/AwardPage2';
import EvaluationPage from './components/pages/EvaluationPage';
import FuturePage from './components/pages/FuturePage';
import MembersPage from './components/pages/MembersPage';
import BestEsgPage from './components/pages/BestEsgPage';
import OrgPage from './components/pages/OrgPage';
import HistoryPage from './components/pages/HistoryPage';
import CiPage from './components/pages/CiPage';
import LocationPage from './components/pages/Location';
import AwardProcessPage from './components/pages/AwardProcessPage';
import AwardCriteriaPage from './components/pages/AwardCriteriaPage';
import EducationCoursePage from './components/pages/EducationCoursePage';
import PolicyResearchPage from './components/pages/PolicyResearchPage';
import DonationPage from './components/pages/DonationPage';
import NoticePage from './components/pages/NoticePage';
import AwardGalleryPage from './components/pages/AwardGalleryPage';
import OperationPlanPage from './components/pages/OperationPlanPage';
import CoverPage from './components/pages/CoverPage';

export const SITE_NAME = '사회적책임경영품질원 SRMQ';

/* ------------------------------------------------------------------ */
/* 1. 페이지 목록 (주소 → 파일)                                          */
/*    title 은 브라우저 탭 제목으로 쓰입니다.                              */
/* ------------------------------------------------------------------ */
export const PAGES = [
  { path: '/',                 Component: ProgramPage,         title: null },

  // 사경원 소개
  { path: '/greeting',         Component: GreetingPage,        title: '인사말' },
  { path: '/purpose',          Component: PurposePage,         title: '설립목적' },
  { path: '/history',          Component: HistoryPage,         title: '연혁 & 네트워크' },
  { path: '/org',              Component: OrgPage,             title: '조직도' },
  { path: '/future',           Component: FuturePage,          title: '발전방향' },
  { path: '/operation-plan',   Component: OperationPlanPage,   title: '운영 계획' },
  { path: '/ci',               Component: CiPage,              title: 'C.I.' },
  { path: '/location',         Component: LocationPage,        title: '오시는길' },

  // 진단/평가
  { path: '/evaluation',       Component: EvaluationPage,      title: '진단 · 평가 프로세스' },

  // SRMQ포상
  { path: '/award2',           Component: AwardPage2,          title: '의의 및 분야' },
  { path: '/award-criteria',   Component: AwardCriteriaPage,   title: '분야별 응모 및 시상 기준' },
  { path: '/award-process',    Component: AwardProcessPage,    title: '포상 심사 및 운영 절차' },
  { path: '/best-esg',         Component: BestEsgPage,         title: '역대 수상조직' },
  { path: '/award-gallery',    Component: AwardGalleryPage,    title: '포상 갤러리' },

  // 교육 · 정책연구
  { path: '/education-course', Component: EducationCoursePage, title: '교육과정' },
  { path: '/policy-research',  Component: PolicyResearchPage,  title: '정책연구 개요' },

  // 기부금후원
  { path: '/donation',         Component: DonationPage,        title: '기부금후원안내' },
  { path: '/members',          Component: MembersPage,         title: '회원 안내' },

  // 공지사항
  { path: '/notice',           Component: NoticePage,          title: '공지사항' },

  // 메뉴에는 없지만 주소로 직접 열 수 있는 페이지
  { path: '/award',            Component: AwardPage,           title: '포상제도' },
  { path: '/vision',           Component: VisionPage,          title: '비전·핵심가치' },
  { path: '/cover',            Component: CoverPage,           title: '표지' },
];

// 다른 주소로 보내는 주소 (from → to)
export const REDIRECTS = [
  { from: '/program', to: '/' },
];

/* ------------------------------------------------------------------ */
/* 2. 상단 메뉴 구성                                                    */
/*    items 안에 children: [{ label, path }] 를 넣으면 2단계 하위메뉴가    */
/*    PC 드롭다운 왼쪽 패널과 모바일 메뉴에 함께 표시됩니다.               */
/* ------------------------------------------------------------------ */
export const MENUS = [
  {
    id: 'about',
    label: '사경원 소개',
    items: [
      { label: '인사말', path: '/greeting' },
      { label: '설립목적', path: '/purpose' },
      { label: '연혁', path: '/history' },
      { label: '조직도', path: '/org' },
      { label: '발전방향', path: '/future' },
      { label: '운영 계획', path: '/operation-plan' },
      { label: 'C.I.', path: '/ci' },
      { label: '오시는길', path: '/location' },
    ],
  },
  {
    id: 'eval',
    label: '진단/평가',
    items: [{ label: '진단 · 평가 프로세스', path: '/evaluation' }],
  },
  {
    id: 'award',
    label: 'SRMQ포상',
    items: [
      { label: '의의 및 분야', path: '/award2' },
      { label: '분야별 응모 및 시상 기준', path: '/award-criteria' },
      { label: '포상 심사 및 운영 절차', path: '/award-process' },
      { label: '역대 수상조직', path: '/best-esg' },
      { label: '포상 갤러리', path: '/award-gallery' },
    ],
  },
  {
    id: 'edu',
    label: '교육',
    items: [{ label: '교육과정', path: '/education-course' }],
  },
  {
    id: 'research',
    label: '정책연구',
    items: [{ label: '정책연구 개요', path: '/policy-research' }],
  },
  {
    id: 'donation',
    label: '기부금후원',
    items: [
      { label: '기부금후원안내', path: '/donation' },
      { label: '회원 안내', path: '/members' },
    ],
  },
  {
    id: 'notice',
    label: '공지사항',
    items: [{ label: '공지사항', path: '/notice' }],
  },
];

/* ------------------------------------------------------------------ */
/* 3. 도우미                                                           */
/* ------------------------------------------------------------------ */
const normalize = (pathname) => {
  const p = pathname.toLowerCase().replace(/\/+$/, '');
  return p === '' ? '/' : p;
};

const menuPaths = (menu) =>
  menu.items.flatMap((item) => [item.path, ...(item.children ?? []).map((c) => c.path)]);

// 현재 주소가 속한 상단 메뉴 (메뉴 밖 페이지면 null)
export const findMenuByPath = (pathname) => {
  const p = normalize(pathname);
  if (p === '/') return MENUS[0]; // 첫 화면에서는 기존처럼 '사경원 소개'에 표시
  return MENUS.find((menu) => menuPaths(menu).includes(p)) ?? null;
};

export const findPageByPath = (pathname) => {
  const p = normalize(pathname);
  return PAGES.find((page) => page.path === p) ?? null;
};

export const isCurrentPath = (pathname, path) => normalize(pathname) === path;
