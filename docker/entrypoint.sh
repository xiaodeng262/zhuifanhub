#!/bin/sh
# ============================================================
# 容器启动钩子
# ------------------------------------------------------------
# 业务动机：
#   每次容器启动都先把 prisma migrations 推到最新，避免发版时漏跑迁移
#   migrate deploy 是幂等的，已应用的迁移会被跳过，重启不会重复执行
# 失败策略：
#   迁移失败立即退出，不启动 server.js；compose 会按重启策略重试
# ============================================================
set -e

echo "[entrypoint] running prisma migrate deploy ..."
# 切到 /opt/migrator 跑迁移：那里有完整 node_modules，包含 prisma 的所有 transitive deps
# (effect/empathic/fast-check/pure-rand 等被 npm hoist 的包)
# 跑完切回 /app 由 CMD exec server.js
cd /opt/migrator

attempt=1
max_attempts="${PRISMA_DB_WAIT_MAX_ATTEMPTS:-30}"
sleep_seconds="${PRISMA_DB_WAIT_SLEEP_SECONDS:-2}"

while :; do
  if output=$(node node_modules/prisma/build/index.js migrate deploy 2>&1); then
    printf '%s\n' "$output"
    break
  fi

  printf '%s\n' "$output" >&2

  if printf '%s\n' "$output" | grep -q 'P1001:'; then
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "[entrypoint] database still unreachable after ${max_attempts} attempts" >&2
      exit 1
    fi

    echo "[entrypoint] database not ready yet, retrying in ${sleep_seconds}s (${attempt}/${max_attempts}) ..." >&2
    attempt=$((attempt + 1))
    sleep "$sleep_seconds"
    continue
  fi

  exit 1
done

cd /app

echo "[entrypoint] starting next server ..."
exec "$@"
