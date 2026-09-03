#!/bin/sh
set -eu

DATA_DIR="${PB_DATA_DIR:-/pb/pb_data}"
mkdir -p "$DATA_DIR"

if [ -n "${POCKETBASE_ADMIN_EMAIL:-}" ] && [ -n "${POCKETBASE_ADMIN_PASSWORD:-}" ]; then
	/pb/pocketbase superuser upsert "$POCKETBASE_ADMIN_EMAIL" "$POCKETBASE_ADMIN_PASSWORD" --dir="$DATA_DIR" || true
fi

exec /pb/pocketbase serve \
	--http=0.0.0.0:8090 \
	--dir="$DATA_DIR" \
	--migrationsDir=/pb/pb_migrations \
	--hooksDir=/pb/pb_hooks
