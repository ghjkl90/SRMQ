// src/data/siteInfo.js
// 사이트 하단(푸터) · 이용약관 · 개인정보처리방침 · 환불정책에 함께 쓰는 기관 정보입니다.
//
// ⚠ 카드사 심사: 상호 · 대표자 · 주소 · 사업자등록번호가 사업자등록증(고유번호증)과 글자까지 같아야 합니다.
//    아래 ★ 표시 값은 증명서를 보고 꼭 확인 · 입력하세요. 값이 빈 항목은 하단에 표시되지 않습니다.

export const SITE_INFO = {
  name: '(사)사회적책임경영품질원', // ★ 상호 (토스 신청서 · 증명서와 같게)
  representative: '신완선', // ★ 대표자
  bizNoLabel: '사업자등록번호', // 고유번호증이어도 그 번호(000-82-00000)를 그대로 적으면 됩니다
  bizNo: '119-82-09863',
  address: '서울특별시 송파구 거여동 568-1', // ★ 증명서의 사업장 소재지와 같게
  tel: '02-2025-9171~2',
  fax: '02-2025-9179',
  email: 'srmq2015@daum.net',
  hours: '평일 09:00~18:00',
  privacyOfficer: {
    name: '이종성',
    position: '사무국장',
    department: '사무국',
    tel: '02-2025-9171',
    email: 'srmq2015@daum.net',
  },
};

// 이용약관 · 개인정보처리방침 · 환불정책 시행일 (내용을 바꾸면 날짜도 바꾸고, 7일 전부터 공지)
export const POLICY_EFFECTIVE_DATE = '2026년 11월 10일';

export const privacyOfficerText = (officer = SITE_INFO.privacyOfficer) =>
  [officer.name, officer.position, officer.name ? '' : officer.department].filter(Boolean).join(' ') +
  ` (${officer.tel} · ${officer.email})`;
