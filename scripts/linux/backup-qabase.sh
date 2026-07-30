#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
COMPOSE_FILE="$PROJECT_ROOT/deploy/compose.yaml"
ENV_FILE="$PROJECT_ROOT/deploy/.env"
BACKUP_DIR="$PROJECT_ROOT/deploy/backups"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing deploy/.env. Copy deploy/.env.example before running backups." >&2
  exit 1
fi

retention_days=$(
  sed -n 's/^QABASE_BACKUP_RETENTION_DAYS=//p' "$ENV_FILE" | tail -n 1
)
retention_days=${retention_days:-30}

case "$retention_days" in
  *[!0-9]*|'')
    echo "QABASE_BACKUP_RETENTION_DAYS must be a positive integer." >&2
    exit 1
    ;;
esac

if [ "$retention_days" -lt 1 ]; then
  echo "QABASE_BACKUP_RETENTION_DAYS must be greater than zero." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%d-%H%M%S)
filename="qabase-$timestamp.db"

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T \
  -e "QABASE_BACKUP_PATH=/backups/$filename" \
  qabase node scripts/backupInstance.js

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -type f \
  -name 'qabase-*.db' \
  -mtime "+$retention_days" \
  -delete

echo "Backup available at: $BACKUP_DIR/$filename"
