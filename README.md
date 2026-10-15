# 🌿 SRMQ 사회적책임경영품질원 리뉴얼 웹사이트

사단법인 사회적책임경영품질원(SRMQ)의 공식 웹사이트 리뉴얼 프로젝트입니다.  
Figma로 정밀 설계된 UI/UX 디자인 시안을 바탕으로, 데스크톱부터 모바일까지 다양한 디바이스 환경에서 최적의 사용자 경험을 제공하도록 반응형으로 개발 및 배포되었습니다.

---

## 📌 목차 (Table of Contents)
1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택 (Tech Stack)](#-기술-스택-tech-stack)
3. [핵심 구현 기능 (Key Features)](#-핵심-구현-기능-key-features)
4. [코드 포맷팅 및 스타일 아키텍처](#-코드-포맷팅-및-스타일-아키텍처)
5. [시작하기 (Getting Started)](#-시작하기-getting-started)

---

## 📖 프로젝트 개요

* **프로젝트명:** SRMQ 사회적책임경영품질원 리뉴얼 웹 홈페이지 개발
* **담당 역할:** UI/UX 디자인 퍼블리싱, 프론트엔드 기능 구현, 반응형 최적화, Vercel 배포 및 도메인 연동
* **기반 시안:** Figma UI/UX 가이드라인 및 디자인 시스템
* **타깃 디바이스:** PC 데스크톱, 노트북, 태블릿, 모바일 (Full Responsive)

---

## 🛠 기술 스택 (Tech Stack)

### Core & Framework
* **Framework:** Next.js (App Router)
* **Library:** React (Functional Components & Hooks, Context API)
* **Language:** JavaScript / TypeScript

### Styling & UI
* **Styling:** CSS Modules (`*.module.css`), Global CSS (`globals.css`)
* **Design Tool:** Figma
* **Deployment:** Vercel

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

* **Next.js (App Router) 구조화:** 페이지 레벨 컴포넌트(`page.js`)와 재사용 UI 컴포넌트(`components/`)를 명확히 분리하여 렌더링 효율성 및 유지보수성 향상.
* **CSS Modules 기반 스코프 격리:** 컴포넌트별 고유 클래스 해시를 부여하여 대규모 스타일링 간 클래스명 중첩(Collisions)을 원천 차단.
* **디자인 토큰 일원화 (`globals.css`):** 컬러 팔레트, 폰트 패밀리, 기본 행간(`line-height`) 및 자간을 일괄 정의하여 일관된 톤앤매너 유지.
* **유동적 뷰포트 단위 적용:** 고정 픽셀을 최소화하고 `rem`, `%`, `vw/vh` 단위를 적극 활용한 반응형 레이아웃 설계.
* **시맨틱 마크업:** 웹 접근성(a11y)과 검색 엔진 최적화(SEO)를 고려한 시맨틱 태그 구조 준수.

---

## 🚀 시작하기 (Getting Started)

### 1. 개발 환경 실행

```bash
npm install
npm run dev
