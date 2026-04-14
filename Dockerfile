# syntax=docker/dockerfile:1.7
# ============================================================
# 追番向导 · 生产镜像
# ------------------------------------------------------------
# 多阶段构建，目标：
#   1) 复用 npm 缓存层，源码改动时不重装依赖
#   2) 利用 Next.js standalone trace 把运行时镜像压到 ~200MB
#   3) 同时携带 prisma CLI，让容器启动时能自动执行 migrate deploy
# 基础镜像统一用 node:20-slim (Debian)：
#   - 与 builder 同 OS/libc，prisma "native" query engine 直接复用
#   - 避免 alpine musl 触发 PrismaClientInitializationError
# ============================================================

# ---------- 阶段 1: deps ----------
# 仅安装依赖，便于 Docker 层缓存；只有 package*.json 与 prisma/schema 改动才会失效
FROM node:20-slim AS deps
# prisma 运行需要 openssl；slim 镜像默认不带
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall 会触发 prisma generate，必须先把 schema 拷进来
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---------- 阶段 2: builder ----------
# 编译 Next.js，产出 .next/standalone 与 .next/static
FROM node:20-slim AS builder
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 关闭 next telemetry，避免构建时多余的网络请求
ENV NEXT_TELEMETRY_DISABLED=1
# ---------- 构建期占位环境变量 ----------
# next build 的 "Collecting page data" 阶段会加载所有路由模块，
# 任何在模块顶层读取环境变量并 throw 的代码都会在这里炸。
# 真实的值会在 docker compose 启动容器时由 .env 注入，构建期占位不会泄露到运行时。
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
# AUTH_SECRET 在 lib/auth/session.ts 模块顶层做 ≥16 字符 + production 校验
# 这里给一段足够长的占位，骗过 build 阶段的校验
ENV AUTH_SECRET="build-time-placeholder-not-a-real-secret"
RUN npm run build

# ---------- 阶段 3: runner ----------
# 最小运行镜像：只包含 server.js + 必需 node_modules + prisma 迁移工具
FROM node:20-slim AS runner
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# 非 root 用户运行，降低容器逃逸风险
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# Next standalone trace 自动算出最小 node_modules，server.js 同级
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

# Prisma 迁移所需：CLI + schema + migrations 历史
# standalone trace 默认不包含 prisma CLI，需手动补齐供 entrypoint 调用
COPY --from=builder --chown=nextjs:nodejs /app/prisma                   ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma      ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma     ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma     ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# 启动脚本：先跑 migrate deploy，再 exec 启动 server.js
COPY --chown=nextjs:nodejs docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000

# 让 docker / compose healthcheck 能直接探测 next 服务
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
