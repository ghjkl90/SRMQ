# 오라클 클라우드 배포 가이드 (Docker 없이)

## 어떤 구성인가요

```
                       ┌──────────── Oracle Cloud VM (Ampere A1 · Ubuntu 24.04) ─────────────┐
 브라우저 ── https ──▶ │ Caddy (웹서버 · HTTPS 인증서 자동 발급)                               │
 www.srmq.or.kr        │  ├─ /           → /srv/srmq/site/current   (React 빌드 결과)          │
                       │  ├─ /uploads/*  → /srv/srmq/uploads        (갤러리 사진)              │
                       │  └─ /api/*      → Node API  (서비스 이름 srmq-api, 127.0.0.1:4000)    │
                       │                     └─▶ PostgreSQL (같은 서버 안, 외부 접속 없음)      │
                       └──────────────────────────────────────────────────────────────────────┘
 토스페이먼츠 ── 웹훅 ──▶ /api/payments/toss/webhook
```

- **Docker 를 쓰지 않습니다.** PC 에서 쓰는 것과 같은 프로그램(Node.js · PostgreSQL)을 서버에 직접 설치하고, API 는 Linux 기본 기능(systemd)으로 서버가 켜질 때 자동 실행됩니다.
- 설치는 `deploy/setup-server.sh` 하나가 처음부터 끝까지 진행하고, 이후 업데이트는 `bash ~/srmq-web/deploy/update.sh` 한 줄이면 됩니다.
- 프론트와 API 가 **같은 주소**라서 CORS 설정이 필요 없고, 로그인 쿠키도 가장 단순하고 안전한 방식(SameSite=Lax)으로 동작합니다.

### 오라클 계정은 "유료(종량제 · Pay As You Go)" 전환을 권장합니다

- 전환해도 **무료(Always Free) 한도 안의 자원은 계속 0원**이고, 한도를 넘는 사용분만 청구됩니다.
- 무료 계정은 7일 동안 CPU · 네트워크 · 메모리 사용률이 모두 20% 미만인 서버를 회수할 수 있습니다. 방문자가 적은 기관 홈페이지는 여기에 걸리기 쉬운데, 종량제로 전환하면 이 회수를 피할 수 있습니다.
- 오라클에도 관리형 PostgreSQL 서비스(OCI Database with PostgreSQL)가 있지만 **별도 요금**이 붙습니다. 이 홈페이지 규모에는 서버에 직접 설치하는 것으로 충분합니다.

### 다른 방식과 비교

| 방식 | 장점 | 문제 |
|---|---|---|
| Vercel(프론트) + Render 무료(API · DB) | 설정 쉬움 | 무료 API 는 15분 미사용 시 잠들어 첫 요청이 늦고, 무료 DB 는 30일 뒤 만료 → 결제 서비스에 부적합 |
| Vercel(프론트) + 오라클(API · DB) | 지금 배포 방식 유지 | Vercel 무료(Hobby)는 비상업 개인용으로 제한, 주소가 달라 CORS · 쿠키 설정 필요 |
| **오라클 1대에 모두 (권장)** | 무료 한도 안에서 운영, 같은 주소라 구성이 단순 | 서버 관리를 직접 해야 함 → 설치 · 업데이트 · 백업 스크립트 제공 |

> 전환 기간에는 Vercel 사이트를 그대로 두고, 오라클 서버를 **베타 주소(beta.srmq.or.kr)** 로 먼저 완성한 뒤 DNS 만 바꾸면 중단 없이 이전됩니다.

---

## 0. 준비물

- 오라클 클라우드 계정 (가입 · 종량제 전환 시 본인확인용 카드 필요)
- `srmq.or.kr` 도메인 DNS 관리 권한
- 깃허브 저장소 (기존 홈페이지 저장소에 `server/` · `deploy/` · `docs/` 가 들어 있는 상태)
- 토스페이먼츠 개발자센터 계정 (테스트 키는 가입 즉시 발급)

## 1. 오라클 계정

1. 가입할 때 **홈 리전은 `South Korea Central (Seoul)`** 로 고릅니다. 홈 리전은 나중에 바꿀 수 없고, 무료 Arm(Ampere A1) 서버는 춘천(South Korea North)에는 만들 수 없습니다.
2. 콘솔 상단의 **Upgrade** 로 종량제(Pay As You Go) 전환을 신청합니다.
3. 전환 후 **Billing → Budgets** 에서 예산 알림을 1만 원 정도로 걸어 두면, 혹시 무료 한도를 넘는 일이 생겨도 메일로 바로 알 수 있습니다.

## 2. 서버(VM) 만들기

Compute → Instances → **Create instance**

- Image: **Canonical Ubuntu 24.04** (aarch64)
- Shape: **VM.Standard.A1.Flex**, OCPU 2 · 메모리 12GB (현재 Always Free 한도)
- Boot volume: 50~100GB
- SSH 키: **Save private key** 로 내려받아 안전한 곳에 보관 (분실하면 서버에 접속할 수 없습니다)

만든 뒤 인스턴스 화면의 **Public IP address** 를 적어 둡니다. `Out of capacity` 오류가 나면 다른 가용성 도메인(AD)을 고르거나 시간을 두고 다시 시도하세요.

## 3. 보안 목록에서 80 · 443 열기 (콘솔에서)

인스턴스 화면 → Subnet → **Security Lists** → Default Security List → **Add Ingress Rules**

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

서버 **안쪽** 방화벽(iptables)은 7단계의 설치 스크립트가 자동으로 엽니다.

## 4. 베타 주소 연결

DNS 관리 화면에서 A 레코드를 하나 추가합니다. (TTL 300)

| 호스트 | 값 |
|---|---|
| `beta` | 서버 Public IP |

PC 에서 `nslookup beta.srmq.or.kr` 로 서버 IP 가 보이면 다음으로 갑니다.

## 5. 서버 접속 (Windows PowerShell)

```powershell
# 처음 한 번: 내려받은 키 파일을 나만 읽을 수 있게 (안 하면 "UNPROTECTED PRIVATE KEY FILE" 오류)
icacls "C:\경로\ssh-key.key" /inheritance:r /grant:r "$($env:USERNAME):(R)"

ssh -i "C:\경로\ssh-key.key" ubuntu@서버IP
```

## 6. 코드 받기 (서버에서)

공개 저장소라면 바로 받습니다.

```bash
git clone https://github.com/<계정>/<저장소>.git ~/srmq-web
```

비공개 저장소라면 서버용 읽기 전용 키(Deploy key)를 등록한 뒤 받습니다.

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# 출력된 한 줄을 깃허브 저장소 → Settings → Deploy keys → Add deploy key 에 붙여넣기 (Allow write access 는 체크하지 않음)
git clone git@github.com:<계정>/<저장소>.git ~/srmq-web
```

> 새 기능을 아직 `main` 이 아닌 브랜치(예: `member-system`)에서 작업 중이라면 `git clone -b member-system ...` 으로 그 브랜치를 받습니다. 나중에 `main` 에 합친 뒤에는 `cd ~/srmq-web && git checkout main` 한 번이면 됩니다.

## 7. 서버 설치 (한 번)

```bash
bash ~/srmq-web/deploy/setup-server.sh beta.srmq.or.kr
```

10분 안팎이 걸리며 다음을 순서대로 진행합니다. 중간에 멈췄다면 원인을 고친 뒤 같은 명령을 다시 실행하면 됩니다. (이미 된 단계는 건너뜁니다)

1. 기본 패키지 설치 · 서버 시간대를 한국으로
2. Node.js 24 설치
3. Caddy(웹서버 · HTTPS 인증서 자동 발급) 설치
4. PostgreSQL 설치 · DB 계정 생성 (비밀번호는 임의로 만들어 `server/.env` 에 저장)
5. `/srv/srmq` 폴더(사이트 · 사진 · 백업)와 `server/.env` 준비
6. API 를 서비스(`srmq-api`)로 등록 → 서버가 재부팅돼도 자동 실행
7. 서버 방화벽 80 · 443 열기 · Caddy 설정 · 매일 03:30 백업 예약
8. 첫 배포 (프론트 빌드 → API 실행 → 상태 확인)

`✔ 서버 설정이 끝났습니다` 가 나오면 https://beta.srmq.or.kr 에 접속해 봅니다. 인증서는 DNS 가 맞으면 1분 안에 자동으로 발급됩니다.

## 8. 관리자 계정 · 기존 갤러리 사진 (처음 한 번)

```bash
cd ~/srmq-web/server
npm run create-admin -- --email admin@srmq.or.kr --name 관리자
# → 임시 비밀번호가 한 번 출력됩니다. 로그인 후 마이페이지에서 바꾸세요.

npm run import-gallery -- --images ../src/assets/award-gallery
# → 기존 사진 105장이 웹용 크기로 변환되어 등록됩니다. (18MB 사진 → 수백 KB)
```

회원명부는 PC 에서 서버로 파일을 보낸 뒤 등록합니다. (명부 파일은 깃허브에 올리지 않습니다)

```powershell
# PC PowerShell
scp -i "$HOME\.ssh\srmq-oracle.key" "C:\경로\members-import.csv" ubuntu@서버IP:~/members-import.csv
```

```bash
# 서버
cd ~/srmq-web/server
npm run import-members -- --file ~/members-import.csv --dry-run   # 확인만
npm run import-members -- --file ~/members-import.csv             # 등록
rm ~/members-import.csv                                           # 등록 후 서버에서 삭제
```

## 9. 메일 · 토스페이먼츠 설정

```bash
nano ~/srmq-web/server/.env        # SMTP_* · TOSS_CLIENT_KEY · TOSS_SECRET_KEY 입력 후 Ctrl+O, Enter, Ctrl+X
sudo systemctl restart srmq-api
```

토스페이먼츠 개발자센터에서

1. API 키 → **결제위젯 연동 키**(test_gck · test_gsk)를 위 `.env` 에 입력
2. 웹훅 → URL `https://beta.srmq.or.kr/api/payments/toss/webhook`, 이벤트 `PAYMENT_STATUS_CHANGED` · `DEPOSIT_CALLBACK` 등록
3. 테스트 결제 → 관리자 콘솔에서 환불까지 확인
4. PG 계약 · 카드사 심사가 끝나면 **라이브 키(live_gck · live_gsk)** 로 바꾸고 다시 `sudo systemctl restart srmq-api`

베타 서버에서 결제 흐름만 보여 주려면 `.env` 에 `TEST_PAYMENT_ENABLED=true` 를 넣고 재시작하면 결제 화면에 **0원 테스트 결제**가 생깁니다. 실제 주소로 전환(10단계)하기 전에 반드시 `false` 로 되돌리세요.

## 10. 실제 주소로 전환 (1차 오픈)

1. DNS 에서 `www` 와 `@`(srmq.or.kr) A 레코드를 서버 IP 로 바꿉니다.
2. 서버에서 주소만 바꿉니다. DB · 사진 · 비밀번호는 그대로 유지됩니다.
   ```bash
   bash ~/srmq-web/deploy/setup-server.sh www.srmq.or.kr srmq.or.kr
   ```
   `srmq.or.kr` 로 들어온 방문자는 `www.srmq.or.kr` 로 자동 이동합니다.
3. 토스 웹훅 주소를 `https://www.srmq.or.kr/api/payments/toss/webhook` 으로 바꿉니다.
4. 잘 열리면 Vercel 프로젝트의 도메인 연결을 해제합니다.

## 11. 이후 업데이트

PC 에서 고친 코드를 깃허브에 올린 뒤, 서버에서

```bash
bash ~/srmq-web/deploy/update.sh
```

받기 → 빌드 → 사이트 교체 → API 재시작 → 상태 확인까지 한 번에 진행합니다. 화면에 문제가 있으면 직전 빌드로 바로 되돌릴 수 있습니다.

```bash
ls /srv/srmq/site/releases                         # 최근 빌드 3개
ln -sfn releases/<이전폴더> /srv/srmq/site/current
```

**(선택) 자동 배포**: `deploy/github-actions-deploy.yml` 을 저장소의 `.github/workflows/deploy.yml` 로 옮기고, 저장소 Settings → Secrets 에 `OCI_HOST`(서버 IP) · `OCI_SSH_KEY`(2단계에서 내려받은 키 파일의 내용 전체)를 넣으면 main 에 올릴 때마다 테스트 → 빌드 확인 → 배포가 자동으로 진행됩니다.

## 12. 백업

설치 때 매일 03:30 자동 백업이 예약됩니다. (`/srv/srmq/backups`, 14일 보관, 로그는 `~/srmq-backup.log`)

```bash
bash ~/srmq-web/deploy/backup.sh  # 지금 바로 백업
crontab -l                        # 예약 확인
```

서버 고장에 대비해 외부에도 보관하려면 `rclone` 으로 Oracle Object Storage(S3 호환, 무료 한도 20GB)를 등록하고 `crontab -e` 의 백업 줄 앞에 `RCLONE_REMOTE=oci:srmq-backups` 를 붙입니다. 복원 방법은 `backup.sh` 맨 아래에 있습니다.

## 자주 쓰는 명령

```bash
systemctl status srmq-api                 # API 상태
journalctl -u srmq-api -f                 # API 실시간 로그 (결제 · 오류 확인, Ctrl+C 로 종료)
sudo systemctl restart srmq-api           # API 재시작 (.env 를 고친 뒤)
journalctl -u caddy -n 50                 # 웹서버 · 인증서 로그
sudo -u postgres psql srmq                # DB 접속 (\q 로 종료)

# 회비 금액 변경 예시 (화면 · 결제 금액에 바로 반영)
sudo -u postgres psql srmq -c "UPDATE membership_plans SET annual_fee = 60000 WHERE code = 'REGULAR';"
```

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 사이트가 열리지 않음 | 3단계 보안 목록(80 · 443), `nslookup` 으로 DNS, `journalctl -u caddy -n 50` 의 인증서 오류 |
| `502 Bad Gateway` | API 가 꺼짐 → `journalctl -u srmq-api -n 50` 마지막 오류 확인 |
| `update.sh` 빌드 중 `Cannot find native binding` · `Cannot find module @rollup/...` | PC 에서 `package-lock.json` 과 `node_modules` 를 지우고 `npm install` 로 다시 만든 뒤 깃허브에 올리고 다시 배포 |
| `git pull` 이 멈추거나 거절됨 | 서버에서 파일을 직접 고쳤는지 확인 (`git status`), 고친 내용은 PC 에서 반영 후 `git checkout -- 파일` |
| 서버 자체가 응답 없음 | 오라클 콘솔에서 인스턴스 상태 확인 → Reboot (API · DB · 웹서버는 자동으로 다시 켜짐) |

## 프론트를 Vercel 에 계속 두고 싶다면

1. API 를 `api.srmq.or.kr` 같은 하위 도메인으로 운영 (`/etc/caddy/Caddyfile` 에 해당 주소 블록 추가 후 `sudo systemctl reload caddy`)
2. Vercel 환경변수 `VITE_API_BASE_URL=https://api.srmq.or.kr`
3. `server/.env` 에 `EXTRA_ALLOWED_ORIGINS=https://www.srmq.or.kr` (Vercel 쪽 주소)
4. 프론트와 API 가 같은 `srmq.or.kr` 아래 주소면 쿠키 설정은 그대로, `vercel.app` 주소에서 쓴다면 `COOKIE_SAMESITE=none` 필요

Vercel 무료(Hobby) 요금제는 비상업 개인용으로 제한되므로, 회비를 받는 기관 홈페이지라면 Pro 요금제를 검토해야 합니다.

---

참고: [Oracle Always Free 자원](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm) · [Caddy 설치](https://caddyserver.com/docs/install) · [OCI Database with PostgreSQL 요금](https://www.oracle.com/cloud/postgresql/pricing/)
