#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  최신 코드로 다시 배포 (서버에서 ubuntu 계정으로 실행)
#    bash ~/srmq-web/deploy/update.sh
#
#  1) 깃허브에서 코드 받기  2) 프론트엔드 빌드 → 사이트 교체(중단 없음)
#  3) API 패키지 설치 → 재시작 (DB 테이블 변경은 API 가 시작할 때 자동 적용)  4) 상태 확인
#
#  문제가 생기면 이전 화면으로 즉시 되돌리기:
#    ls /srv/srmq/site/releases                       (최근 빌드 3개)
#    ln -sfn releases/<이전폴더> /srv/srmq/site/current
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${DATA_DIR:-/srv/srmq}"
SITE_DIR="$DATA_DIR/site"
SERVICE="srmq-api"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4000/api/health}"

die() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }
[ "$(id -u)" -ne 0 ] || die "sudo 없이 ubuntu 계정으로 실행하세요."
[ -f "$ROOT/server/.env" ] || die "server/.env 가 없습니다. 먼저 deploy/setup-server.sh 를 실행하세요."
[ -d "$SITE_DIR" ] || die "$SITE_DIR 폴더가 없습니다. 먼저 deploy/setup-server.sh 를 실행하세요."
cd "$ROOT"

echo "▶ 1/4 코드 받기"
if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  git pull --ff-only
else
  echo "  (연결된 원격 저장소가 없어 건너뜀)"
fi
echo "  현재 버전: $(git log -1 --format='%h %s' 2>/dev/null || echo '알 수 없음')"

echo "▶ 2/4 프론트엔드 빌드 · 교체"
npm ci --include=dev --no-audit --no-fund
npm run build
STAMP="$(date +%Y%m%d%H%M%S)"
mkdir -p "$SITE_DIR/releases"
cp -r dist "$SITE_DIR/releases/$STAMP"
ln -sfn "releases/$STAMP" "$SITE_DIR/current.tmp"
mv -Tf "$SITE_DIR/current.tmp" "$SITE_DIR/current"
# 최근 빌드 3개만 남기기
find "$SITE_DIR/releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r | tail -n +4 |
  while read -r old; do rm -rf "${SITE_DIR:?}/releases/$old"; done
echo "  사이트 교체: releases/$STAMP"

echo "▶ 3/4 API 설치 · 재시작"
(cd server && npm ci --omit=dev --no-audit --no-fund)
sudo systemctl restart "$SERVICE"

echo "▶ 4/4 상태 확인"
for _ in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✔ 배포 완료"
    exit 0
  fi
  sleep 1
done
echo "--- 최근 API 로그 ---" >&2
sudo journalctl -u "$SERVICE" -n 30 --no-pager >&2 || true
die "API 가 응답하지 않습니다. 위 로그를 확인하세요.  (전체 로그: journalctl -u $SERVICE -n 100)"
