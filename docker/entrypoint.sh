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
node node_modules/prisma/build/index.js migrate deploy
cd /app

echo "[entrypoint] starting next server ..."
exec "$@"
