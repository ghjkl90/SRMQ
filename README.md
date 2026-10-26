# 🌿 SRMQ 사회적책임경영품질원 리뉴얼 웹사이트

사단법인 사회적책임경영품질원(SRMQ)의 공식 웹사이트 리뉴얼 프로젝트입니다.  
Figma로 정밀 설계된 UI/UX 디자인 시안을 바탕으로, 데스크톱부터 모바일까지 다양한 디바이스 환경에서 최적의 사용자 경험을 제공하도록 반응형으로 개발 및 배포되었습니다.

---

## 📌 목차 (Table of Contents)
1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택 (Tech Stack)](#-기술-스택-tech-stack)
3. [핵심 구현 기능 (Key Features)](#-핵심-구현-기능-key-features)
4. [코드 포맷팅 및 스타일 아키텍처](#-코드-포맷팅-및-스타일-아키텍처)
5. [도메인 네임서버 이전 및 인프라 마이그레이션 (Troubleshooting & Ops)](#-도메인-네임서버-이전-및-인프라-마이그레이션-troubleshooting--ops)
6. [시작하기 (Getting Started)](#-시작하기-getting-started)

---

## 📖 프로젝트 개요

- **프로젝트명:** SRMQ 사회적책임경영품질원 리뉴얼 웹 홈페이지 개발
- **담당 역할:** UI/UX 디자인 퍼블리싱, 프론트엔드 기능 구현, 반응형 최적화, DNS/인프라 이전, SEO 및 Vercel 배포
- **기반 시안:** Figma UI/UX 가이드라인 및 디자인 시스템
- **타깃 디바이스:** PC 데스크톱, 노트북, 태블릿, 모바일 (Full Responsive)

---

## 🛠 기술 스택 (Tech Stack)

### Core & Framework
- **Framework:** Next.js (App Router)
- **Library:** React (Functional Components & Hooks, Context API)
- **Language:** JavaScript / TypeScript

### Styling & UI
- **Styling:** CSS Modules (`*.module.css`), Global CSS (`globals.css`)
- **Design Tool:** Figma

### Infrastructure & Ops
- **Deployment & Hosting:** Vercel
- **DNS / Domain Management:** 후이즈(Whois) 네임서버 고급설정
- **Email Service Routing:** Daum 스마트워크 (카카오워크 기업메일)
- **Search Engine Optimization (SEO):** Google Search Console, Naver Search Advisor

---

## ✨ 핵심 구현 기능 (Key Features)

1. **Figma 시안 기반 정밀 UI 구현**
   * 정량적인 디자인 수치(그리드, 타이포그래피, 여백)를 100% 반영하여 시각적 완성도 확보.
2. **풀 반응형(Full Responsive) 웹 지원**
   * 모바일 및 태블릿 전용 뷰포트 대응, 해상도 축소/확대 시 레이아웃 깨짐 현상 방지.
3. **인터랙티브 헤더 & 네비게이션**
   * 스크롤 감지에 따른 동적 스타일 전환 및 메뉴 호버/액티브 인터랙션 적용.
4. **전역 모달 및 상태 관리**
   * React Context API를 활용하여 서브 페이지 전반에서 유기적으로 작동하는 문의/안내 팝업 시스템 구축.

---

## 🎨 코드 포맷팅 및 스타일 아키텍처

- **Next.js (App Router) 구조화:** 페이지 레벨 컴포넌트(`page.js`)와 재사용 UI 컴포넌트(`components/`)를 명확히 분리하여 렌더링 효율성 및 유지보수성 향상.
- **CSS Modules 기반 스코프 격리:** 컴포넌트별 고유 클래스 해시를 부여하여 대규모 스타일링 간 클래스명 중첩(Collisions)을 원천 차단.
- **디자인 토큰 일원화 (`globals.css`):** 컬러 팔레트, 폰트 패밀리, 기본 행간(`line-height`) 및 자간을 일괄 정의하여 일관된 톤앤매너 유지.
- **유동적 뷰포트 단위 적용:** 고정 픽셀을 최소화하고 `rem`, `%`, `vw/vh` 단위를 적극 활용한 반응형 레이아웃 설계.
- **시맨틱 마크업:** 웹 접근성(a11y)과 검색 엔진 최적화(SEO)를 고려한 시맨틱 태그 구조 준수.

---

## 🔧 도메인 네임서버 이전 및 인프라 마이그레이션 (Troubleshooting & Ops)

리뉴얼 웹사이트를 기존 기관 도메인(`srmq.or.kr`)에 연결하는 과정에서 발생한 DNS 인프라 오류, 기업 메일 서비스 유실 위기, 구글 검색 인덱스 404 장애를 직접 해결했습니다.

### 1. 후이즈(Whois) 네임서버 변경 및 기관 기업메일 복구
- **문제 상황:** 네임서버를 후이즈로 이전하면서 기존 DNS 레코드가 전면 초기화되어 원내 기업메일(`srmq2015@daum.net`) 수발신이 전면 중단됨.
- **해결 조치:**
  * **MX 레코드 재구성:** 루트 도메인(`@`)에 Daum 스마트워크 기본 수신 서버(`aspmx.daum.net`, 우선순위 10) 및 백업 서버(`alt.aspmx.daum.net`, 우선순위 20)를 연결하여 메일 인프라 정상화.
  * **SPF(TXT) 스팸 방지 필터 구축:** 네임서버 레코드에 `v=spf1 include:_spf.daum.net ~all`을 등록해 외부 발송 메일의 스팸 분류 방지 및 수발신 신뢰도 복구.

### 2. Vercel 도메인 라우팅 및 DNS 충돌 해결
- **문제 상황:** 루트 도메인과 `www` 서브도메인 간 A 레코드와 CNAME 레코드 충돌로 인한 Vercel 도메인 인증 에러 발생.
- **해결 조치:**
  * 루트 도메인(`srmq.or.kr`)은 A 레코드 IP 매핑으로 연결.
  * 서브도메인(`www.srmq.or.kr`)은 Vercel 전용 CNAME 주소(`ef945f35b3d2181e.vercel-dns-017.com`)로 분리 매핑하여 Vercel SSL 인증서 자동 발급 및 `Valid Configuration` 상태 확보.

### 3. 과거 워드프레스 URL 인덱스 보존 및 301 Permanent Redirect 구축
- **문제 상황:** 리뉴얼 이전 워드프레스 기반 URL들이 구글/네이버 검색 결과(사이트링크)에 남아있어 접속 시 `404 Not Found` 에러 발생.
- **해결 조치:**
  * 배포 설정(`vercel.json`)에 정규식 와일드카드(`(.*)`)를 적용한 301 영구 이동(`permanent: true`) 리다이렉트 엔진을 탑재하여 검색 유입 트래픽 손실 및 SEO 랭킹 훼손 방지.
  * **주요 마이그레이션 매핑 내역:**
    - `/srmq-reward/significance-and-field(.*)` ➡️ `/award2` (의의 및 분야)
    - `/introduction/major-bussiness(.*)` ➡️ `/operation-plan` (주요사업)
    - `/introduction/location(.*)` ➡️ `/location` (오시는 길)
    - `/introduction/purpose-of-establishment(.*)` ➡️ `/purpose` (설립목적)
    - `/policy-and-institutional-research/policy-and-institutional-research-summary(.*)` ➡️ `/policy-research` (정책연구)

### 4. 검색 엔진 최적화(SEO) 및 소유권 인증
- Google Search Console 및 Naver Search Advisor의 HTML 소유권 확인 태그(`public/google*.html`, `public/naver*.html`)를 빌드 파이프라인에 배치하고 재색인을 요청하여 포털 검색 결과 정상화 처리.

---

## 🚀 시작하기 (Getting Started)

### 1. 개발 환경 실행

```bash
npm install
npm run dev

```
### 2. 개발 환경 실행
npm run build
git add .
git commit -m "feat: deploy production updates"
git push origin main
