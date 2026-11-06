#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  사경원 홈페이지 · 오라클 클라우드 서버 첫 설정 (Docker 없이 직접 설치)
#
#  사용법 (서버에 ubuntu 계정으로 접속해서, sudo 를 붙이지 말고 실행)
#    bash ~/srmq-web/deploy/setup-server.sh <사이트주소> [이동시킬주소] [인증서알림메일]
#
#    bash ~/srmq-web/deploy/setup-server.sh beta.srmq.or.kr               ← 먼저 베타 주소로 확인
#    bash ~/srmq-web/deploy/setup-server.sh www.srmq.or.kr srmq.or.kr     ← 실제 주소로 전환
#
#  하는 일 (여러 번 실행해도 안전합니다. 이미 된 단계는 건너뛰거나 값만 갱신)
#    1. 기본 패키지 설치 · 서버 시간대(한국)
#    2. Node.js 설치
#    3. Caddy(웹서버 · HTTPS 인증서 자동 발급) 설치
#    4. PostgreSQL 설치 · DB 계정 만들기 (비밀번호는 임의로 만들어 server/.env 에 저장)
#    5. 폴더(/srv/srmq) · server/.env 준비
#    6. API 를 systemd 서비스(srmq-api)로 등록 → 서버가 재부팅돼도 자동 실행
#    7. 방화벽(80 · 443) 열기 · Caddy 설정 · 매일 백업 예약
#    8. update.sh 로 첫 배포 (프론트 빌드 → API 실행 → 상태 확인)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SITE_DOMAIN="${1:-}"
REDIRECT_DOMAIN="${2:-}"
ACME_EMAIL="${3:-srmq@srmq.or.kr}"

NODE_MAJOR="${NODE_MAJOR:-24}"
DATA_DIR="${DATA_DIR:-/srv/srmq}"
DB_NAME="srmq"
DB_USER="srmq"
SERVICE="srmq-api"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
UNIT_FILE="/etc/systemd/system/${SERVICE}.service"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="$(id -un)"
ENV_FILE="$APP_DIR/server/.env"

step() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
die()  { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# ── 입력 확인 ────────────────────────────────────────────────────────────────
[ -n "$SITE_DOMAIN" ] || die "사이트 주소를 넣어 주세요.  예) bash $0 beta.srmq.or.kr"
[ "$(id -u)" -ne 0 ] || die "sudo 없이 ubuntu 계정으로 실행하세요. (필요한 곳에서 스크립트가 sudo 를 씁니다)"
valid_host() { [[ "$1" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]]; }
valid_host "$SITE_DOMAIN" || die "사이트 주소는 https:// 나 / 없이 도메인만 넣어 주세요.  예) www.srmq.or.kr"
[ -z "$REDIRECT_DOMAIN" ] || valid_host "$REDIRECT_DOMAIN" || die "이동시킬 주소가 올바르지 않습니다: $REDIRECT_DOMAIN"
[ "$REDIRECT_DOMAIN" != "$SITE_DOMAIN" ] || die "사이트 주소와 이동시킬 주소가 같습니다."
[[ "$ACME_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+$ ]] || die "메일 주소가 올바르지 않습니다: $ACME_EMAIL"
[ -f "$APP_DIR/package.json" ] && [ -f "$APP_DIR/server/package.json" ] ||
  die "저장소 구조가 맞지 않습니다: $APP_DIR  (맨 위에 package.json, 그 아래 server/ 폴더가 있어야 합니다)"

# needrestart(서비스 재시작 질문 창)가 설치 도중 멈추지 않도록 꺼 둡니다
apt_install() { sudo env DEBIAN_FRONTEND=noninteractive NEEDRESTART_SUSPEND=1 apt-get install -y -q "$@"; }

# server/.env 의 KEY=값 을 바꾸거나(없으면 맨 끝에 추가) — 파일 권한은 그대로 유지
set_env() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp)"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    awk -v k="$key" -v v="$value" 'index($0, k "=") == 1 { print k "=" v; next } { print }' "$ENV_FILE" > "$tmp"
  else
    cat "$ENV_FILE" > "$tmp"
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi
  cat "$tmp" > "$ENV_FILE"
  rm -f "$tmp"
}
get_env() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true; }

# ── 1. 기본 패키지 ───────────────────────────────────────────────────────────
step "1/8 기본 패키지 설치"
sudo apt-get update -y -q
apt_install ca-certificates curl gnupg git openssl
if command -v timedatectl >/dev/null 2>&1; then
  sudo timedatectl set-timezone Asia/Seoul || info "(시간대 설정을 건너뜀)"
fi
info "완료"

# ── 2. Node.js ───────────────────────────────────────────────────────────────
step "2/8 Node.js ${NODE_MAJOR} 설치"
current_major="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || true)"
if [ "$current_major" = "$NODE_MAJOR" ]; then
  info "이미 설치됨: $(node -v)"
else
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh
  sudo env DEBIAN_FRONTEND=noninteractive NEEDRESTART_SUSPEND=1 bash /tmp/nodesource_setup.sh
  apt_install nodejs
  info "설치됨: $(node -v) · npm $(npm -v)"
fi

# ── 3. Caddy ─────────────────────────────────────────────────────────────────
step "3/8 Caddy(웹서버 · 자동 HTTPS) 설치"
if command -v caddy >/dev/null 2>&1; then
  info "이미 설치됨: $(caddy version | cut -d' ' -f1)"
else
  # 공식 설치 방법: https://caddyserver.com/docs/install
  apt_install debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' |
    sudo gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' |
    sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update -y -q
  apt_install caddy
  info "설치됨: $(caddy version | cut -d' ' -f1)"
fi

# ── 4. PostgreSQL ────────────────────────────────────────────────────────────
step "4/8 PostgreSQL 설치 · DB 계정 준비"
if ! command -v psql >/dev/null 2>&1 || ! dpkg -s postgresql >/dev/null 2>&1; then
  apt_install postgresql
fi
sudo systemctl enable --now postgresql >/dev/null 2>&1 || true

# 비밀번호: 이미 만든 server/.env 가 있으면 그 값을 그대로 쓰고, 없거나 예시값이면 새로 만듭니다.
DB_PASS="$(get_env DATABASE_URL | sed -nE 's#^postgres(ql)?://[^:/@]+:([^@]+)@.*#\2#p')"
if [ -z "$DB_PASS" ] || [ "$DB_PASS" = "srmq" ] || ! [[ "$DB_PASS" =~ ^[A-Za-z0-9]+$ ]]; then
  DB_PASS="$(openssl rand -hex 24)"
fi

(cd /tmp && sudo -u postgres psql -X -q -v ON_ERROR_STOP=1 \
  -v db_user="$DB_USER" -v db_name="$DB_NAME" -v db_pass="$DB_PASS") <<'SQL'
SELECT format('CREATE ROLE %I LOGIN', :'db_user')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
ALTER ROLE :"db_user" WITH LOGIN PASSWORD :'db_pass';
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
 WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL
info "DB '${DB_NAME}' · 계정 '${DB_USER}' 준비됨"

# ── 5. 폴더 · server/.env ────────────────────────────────────────────────────
step "5/8 폴더(${DATA_DIR}) · server/.env 준비"
sudo mkdir -p "$DATA_DIR/site/releases" "$DATA_DIR/uploads" "$DATA_DIR/backups"
sudo chown -R "$APP_USER:$APP_USER" "$DATA_DIR"
sudo chmod 755 "$DATA_DIR" "$DATA_DIR/site" "$DATA_DIR/site/releases" "$DATA_DIR/uploads"
sudo chmod 700 "$DATA_DIR/backups"

if [ -f "$ENV_FILE" ]; then
  info "기존 server/.env 사용 (주소 · DB 값만 갱신, 메일 · 토스 키는 그대로)"
else
  cp "$APP_DIR/server/.env.example" "$ENV_FILE"
  info "server/.env 새로 만듦"
fi
chmod 600 "$ENV_FILE"
if [ "$(get_env JWT_SECRET | wc -c)" -lt 33 ] || get_env JWT_SECRET | grep -q '^change-me'; then
  set_env JWT_SECRET "$(openssl rand -hex 32)"
fi
set_env NODE_ENV production
set_env HOST 127.0.0.1
set_env PORT 4000
set_env DATABASE_URL "postgres://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
set_env APP_ORIGIN "https://${SITE_DOMAIN}"
set_env UPLOAD_DIR "${DATA_DIR}/uploads"
info "APP_ORIGIN=https://${SITE_DOMAIN} · UPLOAD_DIR=${DATA_DIR}/uploads"

# ── 6. API 서비스 등록 ───────────────────────────────────────────────────────
step "6/8 API 서비스(${SERVICE}) 등록"
NODE_BIN="$(command -v node)"
sed -e "s#__APP_USER__#${APP_USER}#g" -e "s#__APP_DIR__#${APP_DIR}#g" -e "s#__NODE_BIN__#${NODE_BIN}#g" \
  "$APP_DIR/deploy/srmq-api.service" | sudo tee "$UNIT_FILE" >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE" >/dev/null 2>&1
info "등록됨: $UNIT_FILE (실제 시작은 8단계)"

# ── 7. 방화벽 · Caddy · 백업 예약 ─────────────────────────────────────────────
step "7/8 방화벽 · 웹서버(Caddy) 설정 · 백업 예약"
if command -v netfilter-persistent >/dev/null 2>&1 && command -v iptables >/dev/null 2>&1; then
  # 오라클 Ubuntu 이미지는 22번(SSH) 외에는 막혀 있어서, 맨 아래 REJECT 규칙 앞에 80 · 443 허용을 넣습니다.
  for port in 80 443; do
    if sudo iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null; then
      info "포트 ${port}: 이미 열려 있음"
    else
      pos="$(sudo iptables -L INPUT --line-numbers -n | awk '$2 == "REJECT" { print $1; exit }')"
      sudo iptables -I INPUT "${pos:-1}" -p tcp -m state --state NEW --dport "$port" -j ACCEPT
      info "포트 ${port}: 열었음"
    fi
  done
  sudo netfilter-persistent save >/dev/null 2>&1
else
  info "오라클 기본 방화벽(iptables) 구성이 아니어서 건너뜀. ufw 를 쓴다면:  sudo ufw allow 80,443/tcp"
fi

tmp_caddy="$(mktemp)"
if [ -n "$REDIRECT_DOMAIN" ]; then
  cat "$APP_DIR/deploy/Caddyfile"
else
  sed '/^# >>> redirect/,/^# <<< redirect/d' "$APP_DIR/deploy/Caddyfile"
fi | sed -e "s#__SITE_DOMAIN__#${SITE_DOMAIN}#g" -e "s#__REDIRECT_DOMAIN__#${REDIRECT_DOMAIN}#g" \
         -e "s#__ACME_EMAIL__#${ACME_EMAIL}#g" -e "s#__DATA_DIR__#${DATA_DIR}#g" > "$tmp_caddy"
caddy validate --config "$tmp_caddy" --adapter caddyfile >/dev/null 2>&1 ||
  { caddy validate --config "$tmp_caddy" --adapter caddyfile || true; die "Caddy 설정 확인 실패 (위 메시지 참고)"; }
sudo install -m 644 "$tmp_caddy" "$CADDYFILE"
rm -f "$tmp_caddy"
sudo systemctl enable caddy >/dev/null 2>&1
sudo systemctl restart caddy
info "Caddy 설정 적용: https://${SITE_DOMAIN}${REDIRECT_DOMAIN:+  (https://${REDIRECT_DOMAIN} → 이동)}"

backup_cmd="$APP_DIR/deploy/backup.sh"
if crontab -l 2>/dev/null | grep -Fq "$backup_cmd"; then
  info "백업 예약: 이미 있음"
else
  (crontab -l 2>/dev/null || true; echo "30 3 * * * bash $backup_cmd >> $HOME/srmq-backup.log 2>&1") | crontab -
  info "백업 예약: 매일 03:30 (14일 보관, ${DATA_DIR}/backups)"
fi

# ── 8. 첫 배포 ───────────────────────────────────────────────────────────────
step "8/8 첫 배포 (update.sh)"
bash "$APP_DIR/deploy/update.sh"

cat <<EOF

────────────────────────────────────────────────────────────
 ✔ 서버 설정이 끝났습니다
────────────────────────────────────────────────────────────
 사이트   https://${SITE_DOMAIN}
          (도메인 A 레코드가 이 서버 IP 를 가리켜야 HTTPS 인증서가 발급됩니다.
           오라클 콘솔의 보안 목록(Security List)에서 80 · 443 도 열려 있어야 합니다)
 설정     ${ENV_FILE}
          메일(SMTP) · 토스 키를 채운 뒤:  sudo systemctl restart ${SERVICE}

 다음 할 일 (처음 한 번)
   cd ${APP_DIR}/server
   npm run create-admin -- --email 관리자메일 --name 관리자
   npm run import-gallery -- --images ../src/assets/award-gallery

 상태 확인  systemctl status ${SERVICE} · journalctl -u ${SERVICE} -n 50
 다시 배포  bash ${APP_DIR}/deploy/update.sh
EOF

if [ "$(get_env TEST_PAYMENT_ENABLED)" = "true" ]; then
  printf '\n\033[1;33m⚠ 0원 테스트 결제가 켜져 있습니다 (server/.env TEST_PAYMENT_ENABLED=true).\n  실제 오픈 전에 false 로 바꾸고  sudo systemctl restart %s  를 실행하세요.\033[0m\n' "$SERVICE"
fi
