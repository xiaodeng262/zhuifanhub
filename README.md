# 追番向导 · zhuifanhub

> 由粉丝自发维护的动漫资源互助站。分享与求助番剧链接、壁纸、工具，不限流、不审核、聚在一起更自由。

[![deploy](https://github.com/xiaodeng262/zhuifanhub/actions/workflows/deploy.yml/badge.svg)](https://github.com/xiaodeng262/zhuifanhub/actions/workflows/deploy.yml)

## ✨ 功能特性

- **资源广场**：按新番 / 经典 / 剧场版 / 壁纸 / 工具五大分类聚合，支持 tag 筛选、关键字搜索与热度排序
- **分享 & 求助双向流**：发布资源（share）或发起求助（seek），支持磁力 / 网盘 / 在线 / 站点四类外链
- **互动体系**：评论嵌套回复、收藏、关注作者、@提及通知
- **失效反馈与举报**：用户可一键报死链或内容举报，管理员后台集中处理
- **管理员后台**：用户角色管理、举报工单流转、资源下架
- **对象存储上传**：封面与头像走 S3 兼容存储（AWS S3 / Cloudflare R2 / 阿里云 OSS / 腾讯 COS 均可）
- **SEO 友好**：内置 sitemap、robots、OpenGraph、JSON-LD 结构化数据

## 🧱 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 15 (App Router, Server Components) |
| 语言 | TypeScript 5.6 |
| UI | React 19 + Tailwind CSS 3.4 + lucide-react |
| 数据库 | PostgreSQL 16 |
| ORM | Prisma 6 |
| 对象存储 | S3 兼容（@aws-sdk/client-s3） |
| 鉴权 | 自建 cookie session（HMAC 签名） |
| 容器化 | 多阶段 Dockerfile + docker compose |
| CI/CD | GitHub Actions → GHCR → SSH 自动发版 |

## 📁 项目结构

```
.
├── app/                    # Next.js App Router 路由
│   ├── api/                # REST API 路由（auth/resources/comments/admin/...）
│   ├── admin/              # 管理员后台
│   ├── category/[slug]/    # 分类页
│   ├── resource/[id]/      # 资源详情页
│   └── components/         # 站点级共享 UI
├── lib/
│   ├── auth/               # 登录态、密码哈希、Session 签名
│   ├── store/              # 数据访问层（按聚合根组织）
│   ├── storage/s3.ts       # S3 上传封装
│   └── db.ts               # PrismaClient 单例
├── prisma/
│   ├── schema.prisma       # 数据模型
│   ├── migrations/         # 迁移历史（生产用 prisma migrate deploy）
│   └── seed.ts             # 种子数据脚本
├── public/                 # 静态资源（图标、封面占位）
├── scripts/                # 开发期辅助脚本
├── docker/
│   └── entrypoint.sh       # 容器启动钩子（自动跑迁移）
├── Dockerfile              # 多阶段生产镜像
├── docker-compose.yml      # 本地开发 Postgres
├── docker-compose.prod.yml # 生产 compose（app + postgres）
└── .github/workflows/
    └── deploy.yml          # build → push GHCR → SSH 部署
```

## 🚀 快速开始（本地开发）

### 前置依赖

- Node.js ≥ 20
- Docker Desktop（用于本地 Postgres）
- npm（仓库内的 `package-lock.json` 与 npm 配套）

### 1. 克隆 & 安装依赖

```bash
git clone git@github.com:xiaodeng262/zhuifanhub.git
cd zhuifanhub
npm install        # postinstall 会自动跑 prisma generate
```

### 2. 启动本地 Postgres

```bash
docker compose up -d           # 启动 docker-compose.yml 里的 postgres
```

容器把 `5432` 映射到宿主机 `5433`，避免与本机已装的 Postgres 冲突。

### 3. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local，至少改这几项：
# DATABASE_URL=postgresql://zhuifanhub:zhuifanhub_dev@localhost:5433/zhuifanhub
# AUTH_SECRET=$(openssl rand -hex 32)
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. 数据库初始化

```bash
npx prisma migrate dev         # 应用迁移
npm run db:seed                # 灌入示例资源/用户
```

### 5. 启动开发服务器

```bash
npm run dev
# 打开 http://localhost:3000
```

默认管理员账号由 `ADMIN_USERNAMES` 决定：在 `.env.local` 中把你的注册用户名加入这个列表，再次登录后即获得管理员角色。

## 🔧 环境变量

完整说明见 [`.env.example`](./.env.example)。生产部署关键变量：

| 变量 | 必需 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | 对外完整 URL，影响 OG / sitemap / robots |
| `AUTH_SECRET` | ✅ | Session cookie 签名密钥，`openssl rand -hex 32` 生成 |
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` | ✅* | S3 兼容对象存储配置 |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | ✅* | S3 访问凭证 |
| `S3_PUBLIC_BASE` | ⬜️ | CDN 前缀；缺省时拼 `{endpoint}/{bucket}` |
| `ADMIN_USERNAMES` | ⬜️ | 逗号分隔的管理员用户名列表 |

> ✅* 表示启用上传功能时必填。

## 🛠 常用脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器（已加 ESM 警告静默） |
| `npm run build` | 生产构建（产出 `.next/standalone`） |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 检查 |
| `npm run db:migrate` | 创建并应用新迁移（开发） |
| `npm run db:seed` | 执行 `prisma/seed.ts` |
| `npm run db:studio` | 打开 Prisma Studio 可视化数据库 |

## 🐳 部署（Docker + GitHub Actions）

仓库已内置完整流水线，`push` 到 `main` 自动触发：

```
GitHub Actions runner
     │
     ├─ docker buildx → 推送到 ghcr.io/xiaodeng262/zhuifanhub:sha-xxxxxxx
     │
     └─ SSH 上 VPS
            ├─ 写入 IMAGE_TAG 到 .env
            ├─ docker compose -f docker-compose.prod.yml up -d postgres
            ├─ docker compose -f docker-compose.prod.yml pull app
            ├─ docker compose ... up -d --no-deps app
            └─ 等 healthcheck 通过
```

### 一次性配置

**GitHub Secrets**（仓库 Settings → Secrets and variables → Actions）：

| Secret | 说明 |
|---|---|
| `SSH_HOST` / `SSH_USER` / `SSH_KEY` | 部署目标 VPS 的 SSH 凭证 |
| `SSH_PORT` | 可选，非 22 端口时填 |
| `DEPLOY_PATH` | 服务器上 `docker-compose.prod.yml` 所在目录 |
| `GHCR_PULL_USER` / `GHCR_PULL_TOKEN` | 服务器拉取私有镜像用的 PAT（`read:packages` 权限） |

**服务器侧**：

```bash
# 1) 安装 docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2) 准备部署目录
sudo mkdir -p /srv/zhuifanhub && sudo chown $USER:$USER /srv/zhuifanhub
cd /srv/zhuifanhub

# 3) 上传 docker-compose.prod.yml + 写 .env（参考 .env.example）
#    .env 中至少要有：GHCR_OWNER / POSTGRES_PASSWORD / AUTH_SECRET
#                     NEXT_PUBLIC_SITE_URL / S3_*

chmod 600 .env
```

**反向代理**：`docker-compose.prod.yml` 默认把 app 绑定在 `127.0.0.1:3000`，需用宿主机 nginx / Caddy 反代到 443。

### 回滚

GitHub Actions → `deploy` workflow → Run workflow，`image_tag` 输入框填要回滚到的 `sha-xxxxxxx`，会跳过构建直接重启。

### 数据库迁移

容器 `entrypoint.sh` 在每次启动时自动执行 `prisma migrate deploy`。`migrate deploy` 是幂等的，已应用的迁移会跳过，多次重启安全。

## 📜 协议

本项目仅供学习交流。所有用户上传内容由发布者自行负责，站点不存储版权资源本体，仅提供外链聚合与失效反馈。如有侵权请通过站内举报通道处理。
