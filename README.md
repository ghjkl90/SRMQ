# 사경원 홈페이지 · 회원/결제/포상갤러리 시스템

사단법인 사회적책임경영품질원(SRMQ) 홈페이지에 **로그인 · 회원가입 · 마이페이지 · 회비 결제(토스페이먼츠 / 무통장입금) · 회원탈퇴 · 포상갤러리 관리자 편집 · 관리자 콘솔**을 추가하는 코드입니다.
기존 React(Vite) 화면은 그대로 두고, 새 페이지와 백엔드(API + DB)를 더합니다.

```
srmq-member-system/
├─ frontend/src/        기존 src 폴더에 그대로 덮어쓰면 되는 추가 · 수정 파일
├─ server/              API 서버 (Node.js · Express · PostgreSQL) + 테스트
├─ deploy/              운영 서버 설치 · 배포 · 백업 스크립트 (Docker 없이), Caddy · systemd 설정, GitHub Actions 예시
└─ docs/DEPLOY_ORACLE.md  오라클 클라우드 배포 순서
```

---

## 1. 프론트엔드 적용

1. `frontend/src` 안의 파일을 기존 저장소의 `src` 폴더에 **덮어쓰기(병합)** 합니다.
2. 패키지 설치: `npm i @tosspayments/tosspayments-sdk`
3. 로컬 개발용으로 `vite.config.js` 에 `/api` 프록시를 추가합니다. (`frontend/vite.config.example.js` 참고)

### 새로 추가된 파일

| 위치 | 내용 |
|---|---|
| `api/client.js` | API 호출 도우미 (쿠키 로그인 · 오류 통일 · 업로드 진행률) |
| `auth/AuthContext.jsx` | 로그인 상태 공유 (`useAuth()`) |
| `auth/RouteGuards.jsx` | 로그인 필요 · 관리자 전용 페이지 보호 |
| `hooks/useMembershipPlans.js` | 회원등급(금액 · 혜택) 불러오기 |
| `hooks/useTossPaymentWidget.js` | 토스페이먼츠 결제위젯(v2) 연결 |
| `components/member/*` | 공통 UI(뱃지 · 카드 · 폼 · 표 · 확인창), 공통 CSS(`memberService.css`), 약관 초안(`terms.js`) |
| `data/awardGalleryStatic.js` | 기존 포상갤러리 데이터 (서버 연결 실패 시 예비용) |
| `components/pages/LoginPage.jsx` | 로그인 `/login` |
| `components/pages/SignupPage.jsx` | 회원가입 4단계 `/signup` |
| `components/pages/PasswordResetPage.jsx` | 비밀번호 찾기 · 재설정 `/password-reset` |
| `components/pages/MyPage.jsx` | 마이페이지 `/mypage` (회원 자격 · 결제 내역 · 정보 수정 · 비밀번호) |
| `components/pages/WithdrawalPage.jsx` | 회원탈퇴 `/mypage/withdraw` |
| `components/pages/MembershipCheckoutPage.jsx` | 회비 결제 `/membership/checkout` |
| `components/pages/PaymentSuccessPage.jsx` · `PaymentFailPage.jsx` | 토스 결제 성공/실패 복귀 화면 |
| `components/pages/OrderDetailPage.jsx` | 결제 상세 · 무통장 입금 안내 `/membership/orders/:주문번호` |
| `components/pages/GalleryEditorPage.jsx` | 포상갤러리 앨범 등록/수정 (관리자) |
| `components/pages/AdminConsolePage.jsx` | 관리자 콘솔 `/admin` (입금 확인 · 결제 내역 · 회원 관리 · CSV) |

### 수정된 기존 파일

| 파일 | 바뀐 점 |
|---|---|
| `main.jsx` | `<AuthProvider>` 로 감쌈 |
| `App.jsx` | `routes.jsx` 의 `guard` 값으로 로그인/관리자 페이지 보호 |
| `routes.jsx` | 새 페이지 주소 추가(맨 아래), 기부금후원 메뉴에 "회비 납부" 추가, `/orders/:번호` 같은 주소도 탭 제목 표시 |
| `components/Header.jsx` · `Header.css` | 검색 버튼 오른쪽에 로그인/회원 메뉴, 모바일 메뉴 상단에 회원 메뉴 |
| `components/pages/AwardGalleryPage.jsx` · `.css` | 사진을 서버에서 불러옴, 관리자에게 등록 · 수정 버튼 표시 (서버 연결 실패 시 기존 사진 표시) |
| `components/pages/MembersPage.jsx` | 하단에 회원가입 · 회비 납부 안내 추가 |

모든 새 페이지는 기존 `SubpageLayout.css` 의 뱃지/제목/설명 클래스를 그대로 써서 다른 서브페이지와 뱃지 위치 · 간격이 같습니다.
새 CSS 클래스는 모두 `ms-` 로 시작해 기존 페이지 CSS 와 겹치지 않습니다.

---

## 2. 백엔드 로컬 실행 (Windows · Docker 없이)

### ① PostgreSQL 설치 (처음 한 번)

1. https://www.postgresql.org/download/windows/ → **Download the installer** → 최신 버전(Windows x86-64) 설치 파일 실행
2. 설치 화면은 기본값 그대로 두고, **postgres 비밀번호**만 정해서 기억해 둡니다. (포트 5432 그대로, 마지막 Stack Builder 는 닫아도 됩니다)
3. 시작 메뉴 → **SQL Shell (psql)** → Server · Database · Port · Username 은 Enter 로 넘기고 2번의 비밀번호 입력 → 아래 세 줄 붙여넣기

```sql
CREATE USER srmq WITH PASSWORD 'srmq';
CREATE DATABASE srmq OWNER srmq;
CREATE DATABASE srmq_test OWNER srmq;
```

`srmq` 는 개발용, `srmq_test` 는 자동 테스트용 DB 입니다. (Mac 은 `brew install postgresql@17`, Ubuntu 는 `sudo apt install postgresql` 후 같은 SQL)

### ② API 실행

```powershell
cd server
Copy-Item .env.example .env   # 처음 한 번 (이미 있으면 건너뛰기)
npm install
npm run dev                   # [srmq-api] http://127.0.0.1:4000 (development) 가 보이면 성공
```

테이블은 처음 실행할 때 자동으로 만들어집니다.

### ③ 관리자 계정 · 기존 갤러리 사진 (다른 터미널에서 처음 한 번)

```powershell
cd server
npm run create-admin -- --email admin@srmq.or.kr --name 관리자
npm run import-gallery -- --images ../src/assets/award-gallery
```

create-admin 이 보여 주는 임시 비밀번호로 로그인한 뒤 마이페이지에서 바꾸세요.

### ④ 화면

저장소 맨 위 폴더에서 `npm run dev` → http://localhost:5173 (로그인 · 갤러리 · 결제 화면이 API 와 연결됩니다)

| 오류 메시지 | 원인 · 해결 |
|---|---|
| `ECONNREFUSED ...:5432` | PostgreSQL 이 꺼져 있음 → Windows 서비스 `postgresql-x64-버전` 시작 |
| `password authentication failed` | ①의 SQL 을 안 했거나 `server/.env` 의 `DATABASE_URL` 이 다름 |
| `이미 다른 프로그램 … 포트를 쓰고 있습니다` | API 를 두 번 띄움 → 이전 터미널을 닫고 다시 실행 |
| 화면 터미널의 `http proxy error: /api/...` | API(②)가 꺼져 있음 |

### ⑤ 회원명부 넣기 (회비 납부 완료 회원으로)

```powershell
cd server
npm run import-members -- --file C:/경로/members-import.csv --dry-run   # 먼저 확인만
npm run import-members -- --file C:/경로/members-import.csv             # 실제 등록
```

- CSV 머리글: `성명, 이메일, 휴대폰, 소속, 등급, 자격시작, 만료일, 메모` (엑셀에서 **CSV UTF-8** 로 저장)
- 등록된 회원은 자격이 바로 **정상(납부 완료)** 으로 표시되고, 비밀번호가 없는 상태입니다. 회원이 로그인 화면 → **비밀번호 찾기**에서 자기 이메일로 비밀번호를 만들면(이때 약관 동의) 기존 자격 그대로 로그인합니다.
- 이메일이 없는 행은 건너뜁니다. 나중에 이메일을 채우거나 등급 · 만료일을 고쳐 다시 실행하면, 새 행은 추가되고 아직 사이트에서 결제한 적 없는 명부 회원은 고친 내용으로 바뀝니다. 사이트에서 직접 가입했거나 결제한 회원의 자격은 내려가지 않습니다.
- 회원명부 CSV 는 개인정보이므로 **저장소 폴더 밖**에 두고 깃허브에 올리지 마세요.

### ⑥ 0원 테스트 결제 (사업자등록 · PG 계약 전 시험용)

`server/.env` 에 `TEST_PAYMENT_ENABLED=true` 를 넣고 API 를 다시 실행하면 결제 화면에 **0원 테스트 결제**가 생깁니다. 실제 돈은 나가지 않고, 결제가 끝나면 선택한 등급의 회원 자격이 바로 반영됩니다. 기업회원 등급도 사업자등록번호 없이 시험할 수 있고, 관리자 콘솔 → 결제 내역에서 취소하면 이전 자격으로 돌아갑니다. **실제 오픈 전에는 반드시 `false`** 로 되돌리세요. (켜져 있는 동안 관리자 콘솔 위쪽에 경고가 보입니다)

### 테스트

```powershell
cd server
npm test        # srmq_test DB 사용. 다른 DB 는  $env:TEST_DATABASE_URL="postgres://..."; npm test
```

가입 · 로그인 · CSRF 차단 · 무통장 입금확인 · 토스 승인(금액 위변조 거절, 카드사 거절, 중복 승인) · 가상계좌 입금 웹훅 · 환불 시 자격 복구 · 비밀번호 재설정 · 갤러리 업로드/정리 · 탈퇴 30일 재가입 제한 · 0원 테스트 결제 · 회원명부 이관까지 45개 시나리오를 실제 PostgreSQL 과 가짜 토스 서버로 검증합니다.

### 운영 서버 배포

오라클 클라우드에 Docker 없이 배포하는 순서는 `docs/DEPLOY_ORACLE.md` 에 있습니다. (서버 설치는 `deploy/setup-server.sh` 한 번, 이후 업데이트는 `deploy/update.sh`)

---

## 3. 회원등급 · 회비 규칙

회원 안내 페이지의 내용을 `membership_plans` 테이블에 그대로 넣었습니다. 금액이 바뀌면 DB 에서 `UPDATE` 만 하면 화면과 결제 금액에 함께 반영됩니다.

| 구분 | 코드 | 입회비 | 연회비 | 자격 기간 |
|---|---|---:|---:|---|
| 일반 · 준회원 | ASSOCIATE | 50,000 | - | 기한 없음 |
| 일반 · 정회원 | REGULAR | 100,000 | 50,000 | 1년 |
| 일반 · 종신회원 | LIFETIME | 500,000 | - | 평생 |
| 일반 · 단체회원 | GROUP | - | 100,000 | 1년 |
| 기업 · 내셔널 ESG | NES | - | 2,000,000 | 1년 |
| 기업 · 베스트 ESG | BES | - | 3,000,000 | 1년 |
| 기업 · 글로벌 ESG | GES | - | 5,000,000 | 1년 |
| 특별회원 | SPECIAL | - | 10,000,000 | 1년 (후원금 사용용도 지정) |

결제 금액은 서버(`server/src/services/membership.js`)에서만 계산합니다.

- 신규 가입 · 등급 변경: 새 등급의 입회비 + 연회비(1년)
- 같은 등급 갱신: 연회비만, 만료 90일 전부터 가능 (중복 결제 방지)
- 준회원 · 종신회원처럼 연회비가 없는 등급은 이미 보유 중이면 결제 불가

> 등급 변경 시 입회비를 면제할지 등은 사무국 정책에 맞춰 `buildQuote()` 한 곳만 고치면 됩니다.

---

## 4. 결제 흐름

**카드 · 간편결제 (토스페이먼츠 결제위젯)** — 카드 · 계좌이체 · 가상계좌 · 카카오페이 · 토스페이 · 네이버페이를 위젯 하나로 받습니다. 카카오페이는 토스페이먼츠 상점관리자에서 간편결제로 추가 신청하면 되므로 카카오페이와 따로 계약 · 연동할 필요가 없습니다.

1. 결제하기 → 서버가 주문 생성(금액 계산) → 위젯 `requestPayment()`
2. 결제창 인증 성공 → `/membership/payment/success?paymentKey&orderId&amount`
3. 서버가 주문 금액과 비교 후 토스 **결제 승인 API** 호출 → 결제완료 시 회원 자격 즉시 반영
4. 가상계좌는 입금 대기 → 입금 시 토스 웹훅(`DEPOSIT_CALLBACK`, secret 검증) → 자격 반영

**무통장입금 (법인 계좌 직접 입금)** — 수수료 없음. 신청 시 입금 안내 메일 + 사무국 알림 메일 → 관리자 콘솔 [입금 확인] → 자격 반영 · 결제완료 메일. 입금기한(기본 7일)이 지나면 자동 만료.

토스 웹훅 주소: `https://www.srmq.or.kr/api/payments/toss/webhook` (이벤트: `PAYMENT_STATUS_CHANGED`, `DEPOSIT_CALLBACK`)

---

## 5. 주요 API

| 메서드 · 주소 | 설명 |
|---|---|
| `POST /api/auth/signup` · `login` · `logout`, `GET /api/auth/me` | 가입(자동 로그인) · 로그인 · 로그아웃 · 내 정보 |
| `GET /api/auth/check-email` | 아이디(이메일) 중복확인 |
| `POST /api/auth/password/forgot` · `reset` | 비밀번호 찾기 메일 · 재설정 |
| `PATCH /api/me`, `POST /api/me/password`, `POST /api/me/withdraw` | 정보 수정 · 비밀번호 변경 · 탈퇴 |
| `GET /api/plans`, `GET /api/plans/:code/quote` | 회원등급 · 결제 금액 미리보기 |
| `POST /api/orders`, `GET /api/orders`, `POST /api/orders/:no/cancel` | 주문 생성 · 내 결제 내역 · 취소 |
| `POST /api/payments/toss/confirm`, `POST /api/payments/toss/webhook` | 토스 결제 승인 · 웹훅 |
| `GET /api/gallery` | 포상갤러리 (공개) |
| `/api/admin/*` | 관리자: 요약 · 주문 목록 · 입금 확인 · 취소/환불 · 회원 목록 · 자격 수동 부여 · CSV · 갤러리 CRUD · 이미지 업로드 |

---

## 6. 보안 · 개인정보

- 비밀번호: scrypt 해시 (Node 내장), 영문 · 숫자 · 특수문자 8~16자
- 로그인: httpOnly · SameSite=Lax 쿠키 (자바스크립트로 읽을 수 없음) + 다른 사이트에서 온 변경 요청 차단(Origin 검사)
- 비밀번호 변경 · 재설정 · 탈퇴 시 다른 기기 로그인 즉시 해제
- 로그인 · 가입 · 메일 요청 횟수 제한
- 결제 금액은 서버 계산 · 서버 승인, 웹훅은 토스에 재조회하거나 secret 으로 검증
- 업로드 사진은 2000px 로 줄이고 위치정보(EXIF) 제거
- 탈퇴: 개인정보 즉시 삭제, 결제 기록은 전자상거래법 보존기간 동안 유지, 이메일은 해시로만 남겨 30일 재가입 제한

> `components/member/terms.js` 의 약관 · 개인정보 동의 문구는 초안입니다. 사무국 검토 후 확정하고, 홈페이지에 **개인정보처리방침**도 함께 게시해야 합니다.
