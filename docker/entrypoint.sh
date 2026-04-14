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
# 直接调用 prisma 入口文件，不走 node_modules/.bin/prisma 符号链接：
# Docker 单文件 COPY symlink 时会跟随链接、把 .bin/prisma 拷成普通文件，
# 导致 CLI 内部 __dirname 错位、找不到同目录的 prisma_schema_build_bg.wasm
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] starting next server ..."
exec "$@"
