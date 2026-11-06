#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  DB · 업로드 사진 백업 (setup-server.sh 가 매일 03:30 에 실행되도록 예약해 둡니다)
#    직접 실행:  bash ~/srmq-web/deploy/backup.sh
#
#  - /srv/srmq/backups 에 KEEP_DAYS(기본 14일)만큼 보관
#  - 서버 고장에 대비해 외부에도 보관하려면 rclone 으로 Oracle Object Storage(S3 호환)를 등록한 뒤
#    crontab 줄 앞에 RCLONE_REMOTE=oci:srmq-backups 를 붙입니다.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/server/.env"
read_env() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- | sed -E "s/^['\"]//; s/['\"]$//" || true; }

DATABASE_URL="$(read_env DATABASE_URL)"
UPLOAD_DIR="$(read_env UPLOAD_DIR)"
UPLOAD_DIR="${UPLOAD_DIR:-/srv/srmq/uploads}"
BACKUP_DIR="${BACKUP_DIR:-/srv/srmq/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M)"

[ -n "$DATABASE_URL" ] || { echo "server/.env 에서 DATABASE_URL 을 찾지 못했습니다" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
echo "[$(date '+%F %T')] 백업 시작"

# 1) DB (custom 형식 → pg_restore 로 복원)
pg_dump --dbname="$DATABASE_URL" --format=custom --file="$BACKUP_DIR/db-$STAMP.dump"

# 2) 업로드 사진
if [ -d "$UPLOAD_DIR" ]; then
  tar czf "$BACKUP_DIR/uploads-$STAMP.tgz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
fi

# 3) 오래된 백업 정리
find "$BACKUP_DIR" -type f \( -name 'db-*.dump' -o -name 'uploads-*.tgz' \) -mtime +"$KEEP_DAYS" -delete

# 4) 외부 저장소 복사 (선택)
if [ -n "${RCLONE_REMOTE:-}" ]; then
  rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE" --max-age 2d
fi

echo "[$(date '+%F %T')] 백업 완료: $(du -sh "$BACKUP_DIR" | cut -f1)"

# ── 복원 방법 ────────────────────────────────────────────────────────────────
#  DB:    sudo systemctl stop srmq-api
#         pg_restore --dbname="$(grep ^DATABASE_URL= ~/srmq-web/server/.env | cut -d= -f2-)" \
#                    --clean --if-exists /srv/srmq/backups/db-YYYYMMDD-HHMM.dump
#         sudo systemctl start srmq-api
#  사진:  tar xzf /srv/srmq/backups/uploads-YYYYMMDD-HHMM.tgz -C /srv/srmq
