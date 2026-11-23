// src/data/membershipPlans.js
// 회원 안내(회비 상품) 화면이 서버(/api/plans)를 불러오지 못했을 때 보여 줄 기본값입니다.
// 실제 결제 금액은 항상 서버 DB(membership_plans)가 기준이며, 이 값은 002 시드 + 005(준회원 · 종신회원 10년, 표시 순서) 마이그레이션 결과와 같습니다.

export const FALLBACK_PLANS = [
  {
    code: 'LIFETIME', category: 'GENERAL', name: '종신회원', nameEn: 'Lifetime Member', shortLabel: '종신회원',
    joinFee: 500000, annualFee: 0, term: 'TEN_YEARS', badgeTone: 'lime',
    benefits: ['본원 산하 분과 · 연구회 등 모든 사업에 참여 가능', '본원 소식 및 행사정보 이메일 수신', '연회비 없이 10년간 회원 자격 유지'],
  },
  {
    code: 'REGULAR', category: 'GENERAL', name: '정회원', nameEn: 'Regular Member', shortLabel: '정회원',
    joinFee: 100000, annualFee: 50000, term: 'ANNUAL', badgeTone: 'lime',
    benefits: ['총회 참석 및 의결권 부여', '본원 산하 분과 · 연구회 등 모든 사업에 참여 가능', '본원 소식 및 행사정보 이메일 수신'],
  },
  {
    code: 'ASSOCIATE', category: 'GENERAL', name: '준회원', nameEn: 'Associate Member', shortLabel: '준회원',
    joinFee: 50000, annualFee: 0, term: 'TEN_YEARS', badgeTone: 'lime',
    benefits: ['총회 참석 및 의결권 부여', '본원 산하 분과 · 연구회 등 모든 사업에 참여 가능', '본원 소식 및 행사정보 이메일 수신'],
  },
  {
    code: 'GROUP', category: 'GENERAL', name: '단체회원', nameEn: 'Group Member', shortLabel: '단체회원',
    joinFee: 0, annualFee: 100000, term: 'ANNUAL', badgeTone: 'lime',
    benefits: ['본원 산하 분과 · 연구회 등 모든 사업에 참여 가능', '본원 소식 및 행사정보 이메일 수신'],
  },
  {
    code: 'NES', category: 'CORPORATE', name: '내셔널 ESG', nameEn: 'National ESG', shortLabel: 'NES',
    joinFee: 0, annualFee: 2000000, term: 'ANNUAL', badgeTone: 'green',
    benefits: ['우수사례 연 1회 공유', '컨벤션 연 2명 참석제공', 'K-AI 그린벨트 2명 교육'],
  },
  {
    code: 'BES', category: 'CORPORATE', name: '베스트 ESG', nameEn: 'Best ESG', shortLabel: 'BES',
    joinFee: 0, annualFee: 3000000, term: 'ANNUAL', badgeTone: 'green',
    benefits: ['우수사례 연 2회 공유', '컨벤션 연 1회 홍보', '컨벤션 연 3명 참석 제공', 'K-AI 그린벨트 1명 + 블랙벨트 1명 교육'],
  },
  {
    code: 'GES', category: 'CORPORATE', name: '글로벌 ESG', nameEn: 'Global ESG', shortLabel: 'GES',
    joinFee: 0, annualFee: 5000000, term: 'ANNUAL', badgeTone: 'blue',
    benefits: ['국내·국제 간행물 발송', '컨벤션 연 1회 홍보', '컨벤션 5명 이내 참석 제공', 'K-AI 그린벨트 2명 + 블랙벨트 2명 교육'],
  },
  {
    code: 'SPECIAL', category: 'SPECIAL', name: '특별회원', nameEn: 'Special Member', shortLabel: 'SPECIAL',
    joinFee: 0, annualFee: 10000000, term: 'ANNUAL', badgeTone: 'special',
    benefits: [
      '기업회원 중 글로벌 ESG(GES)과 동일한 혜택 제공',
      '특별회원 후원금은 본원 발전을 위해 사용하며, 사용용도를 지정할 수 있음',
      'ANQ (아시아품질네트워크) 사례발표 및 우수사례 (AREQP) 포상 지원',
    ],
  },
];
