# 追番向导 · 部署完整指南

> 本文写给「第一次接触 Docker / GitHub Actions 部署」的同学。每一步都给出**具体命令**与**预期输出**，照着复制粘贴即可。预计耗时 30~60 分钟。
>
> **前提**：你已经有了一台 VPS（Linux），并且 Docker + Docker Compose 已经装好。没有 Docker 的话先去看 [Docker 官方安装文档](https://docs.docker.com/engine/install/)。

## 📐 总体架构一图流

```
┌─────────────────────────┐                        ┌──────────────────────────────┐
│  你的电脑                │  git push main         │  GitHub 仓库                  │
│  (本地开发)              │ ─────────────────────▶ │  xiaodeng262/zhuifanhub       │
└─────────────────────────┘                        └──────────────┬───────────────┘
                                                                  │ 触发 Actions
                                                                  ▼
                                                   ┌──────────────────────────────┐
                                                   │  GitHub Actions Runner        │
                                                   │  1. docker build              │
                                                   │  2. docker push → ghcr.io     │
                                                   └──────────────┬───────────────┘
                                                                  │ ssh
                                                                  ▼
                  ┌────────────────────────────────────────────────────────────────┐
                  │  你的 VPS                                                       │
                  │   ┌──────────────────┐  ┌──────────────────┐                  │
                  │   │ docker compose   │─▶│ zhuifanhub-app   │ :3000 (本机)     │
                  │   │  pull && up -d   │  └──────────────────┘                  │
                  │   │                  │  ┌──────────────────┐                  │
                  │   │                  │─▶│ zhuifanhub-pg    │ (内部网络)       │
                  │   └──────────────────┘  └──────────────────┘                  │
                  │              ▲                                                 │
                  │              │ 反向代理                                         │
                  │   ┌──────────┴───────┐                                        │
                  │   │ nginx / caddy    │ :443 ← 用户访问                          │
                  │   └──────────────────┘                                        │
                  └────────────────────────────────────────────────────────────────┘
```

读懂这张图你就知道每一步在干嘛了：**代码推到 GitHub → Actions 在云端构建镜像 → SSH 到你的 VPS 拉新镜像并重启容器 → nginx 把 80/443 转发到容器**。

---

## ✅ 部署前清单

开干之前确认以下东西齐全：

- [ ] 一台能 SSH 登录的 VPS，已装好 `docker` 与 `docker compose`
- [ ] VPS 上有一个非 root 的部署用户（建议；用 root 也行但不安全）
- [ ] 一个域名（可选，没有也能用 IP 访问）
- [ ] GitHub 账号已开启二步验证（创建 PAT 必需）
- [ ] 一个 S3 兼容的对象存储桶（AWS S3 / Cloudflare R2 / 阿里云 OSS / 七牛 / 腾讯 COS 任选）

---

## 第一步：在 VPS 上生成 SSH 部署密钥

GitHub Actions 要 SSH 进你的服务器，得有一对**专用的 SSH 密钥**。**不要用你平时登录服务器的那把私钥**，给 Actions 单独发一把，将来不用了直接删掉就行。

> 📌 **为什么整个第一步都在 VPS 上做？**
> SSH 密钥是「一对儿」，在哪台机器生成都行——只要公钥最后落在 VPS 的 `authorized_keys`、私钥最后贴进 GitHub Secret 即可。直接在 VPS 上生成可以省掉「ssh-copy-id 把公钥送上去」这一步，对新手最省事。

### 1.1 创建部署用户（已有则跳过）

```bash
# 用 root SSH 登录 VPS 后执行
adduser deploy                        # 输入密码即可，其它问题一路回车
usermod -aG docker deploy             # 让 deploy 用户能直接用 docker 命令
```

### 1.2 切换到 deploy 用户并生成密钥对

```bash
# 仍然在 VPS 上，从 root 切到 deploy
su - deploy

# 生成专用密钥（一路回车，不要设密码）
ssh-keygen -t ed25519 -C "github-actions-zhuifanhub" -f ~/.ssh/zhuifanhub_deploy -N ""
```

执行后会得到两个文件，**都在 VPS 上**：

- `~/.ssh/zhuifanhub_deploy`：**私钥**，等下要贴到 GitHub Secret 里
- `~/.ssh/zhuifanhub_deploy.pub`：**公钥**，等下加到本机的授权列表

### 1.3 把公钥加入授权列表

```bash
# 还在 deploy 用户身份下，在 VPS 上继续执行
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat ~/.ssh/zhuifanhub_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

这一步等于「告诉 VPS：拿着 zhuifanhub_deploy 这把私钥的人允许以 deploy 身份登录我」。

### 1.4 把私钥内容打印出来准备贴到 GitHub

```bash
cat ~/.ssh/zhuifanhub_deploy
```

终端会打印形如下面的内容：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACA8j+xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
...（中间若干行）...
-----END OPENSSH PRIVATE KEY-----
```

**整段全选**（包含首尾的 `BEGIN/END` 行）复制下来，先临时贴在你电脑的便签里，**等下第三步配置 `SSH_KEY` Secret 时就贴这段**。

### 1.5 验证 deploy 用户能跑 docker

```bash
docker --version && docker compose version
```

**预期输出**：

```
Docker version 24.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

看到这两行就说明 deploy 用户已经能用 docker 了。继续下一步。

> ❗ 如果报 `permission denied while trying to connect to the Docker daemon socket`，说明 1.1 的 `usermod -aG docker deploy` 没生效。**退出当前 shell 重新 `su - deploy` 一次**即可（用户组变更要重新建会话）。

> 🔒 **安全小贴士（可选）**：私钥贴到 GitHub Secret 之后，如果你不需要在本机再用这把私钥，可以从 VPS 上把它删掉，公钥已经在 `authorized_keys` 里了：
> ```bash
> rm ~/.ssh/zhuifanhub_deploy ~/.ssh/zhuifanhub_deploy.pub
> ```
> 这样即便有人偷登 VPS，也拿不到 GitHub Actions 的私钥。

---

## 第二步：创建 GHCR Pull Token（PAT）

GitHub Container Registry（ghcr.io）默认是**私有仓库**。你的 VPS 要去拉镜像，得有一个能读 packages 的访问令牌。

### 2.1 生成 Token

1. 浏览器打开 <https://github.com/settings/tokens?type=beta>
2. 点 **Generate new token (classic)** —— **注意要选 classic，不要选 fine-grained**
3. 填写：
   - **Note**：`zhuifanhub-ghcr-pull`（写啥都行，给自己看的）
   - **Expiration**：建议 1 年（到期记得重新生成）
   - **Select scopes**：**只勾 `read:packages`**，其它一个都不要勾
4. 拉到底点 **Generate token**
5. 看到形如 `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` 的字符串，**立刻复制保存**——离开页面就再也看不到了

### 2.2 在 VPS 上测试这个 Token 能不能用

```bash
# SSH 到你的 VPS 后执行
echo "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" | docker login ghcr.io -u xiaodeng262 --password-stdin
```

把 `ghp_xxx` 换成你刚才复制的 Token，把 `xiaodeng262` 换成你的 GitHub 用户名。

**预期输出**：

```
Login Succeeded
```

> ❗ 如果失败提示 `denied: denied`：说明 Token 没勾 `read:packages` 权限，回 2.1 重新生成。

---

## 第三步：在 GitHub 仓库配置 7 个 Secret

打开 <https://github.com/xiaodeng262/zhuifanhub/settings/secrets/actions>，点右上角 **New repository secret**，**逐个**添加下面 7 个 Secret。

| # | Name | Value | 备注 |
|---|---|---|---|
| 1 | `SSH_HOST` | 你的 VPS 公网 IP，例如 `1.2.3.4` 或域名 | 不带 `http://`、不带端口 |
| 2 | `SSH_USER` | `deploy` | 第一步创建的部署用户名 |
| 3 | `SSH_PORT` | `22` | 没改过 SSH 端口就填 22；改过填实际端口 |
| 4 | `SSH_KEY` | 第 1.2 步生成的**私钥全文** | 见下方说明 |
| 5 | `DEPLOY_PATH` | `/home/deploy/zhuifanhub` | 服务器上放 compose 文件的目录，你自己定 |
| 6 | `GHCR_PULL_USER` | `xiaodeng262` | 你的 GitHub 用户名 |
| 7 | `GHCR_PULL_TOKEN` | 第 2.1 步生成的 PAT | 形如 `ghp_xxx` |

### 关于 `SSH_KEY` 的填法 ⚠️ 最常见的踩坑点

私钥要**整段**复制，包括第一行 `-----BEGIN OPENSSH PRIVATE KEY-----` 和最后一行 `-----END OPENSSH PRIVATE KEY-----`，**末尾要保留换行**。

如果第 1.4 步打印出来的内容你已经复制好了，直接贴进 GitHub 即可。如果窗口关掉了，回 VPS（deploy 用户身份）再来一次：

```bash
cat ~/.ssh/zhuifanhub_deploy
```

看到的内容形如：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACA8j+xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
...（中间若干行）...
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END OPENSSH PRIVATE KEY-----
```

**整段全选** 复制到 GitHub Secret 的 Value 框里。**不要去掉首尾行，不要少换行**。

> 💡 检查方法：粘进去之后看 GitHub 是否提示 `Secret saved`。如果你之后部署报 `error parsing private key`，99% 是这一步贴漏了。

添加完 7 个之后，Secret 列表应该长这样：

```
GHCR_PULL_TOKEN  Updated now
GHCR_PULL_USER   Updated now
DEPLOY_PATH      Updated now
SSH_HOST         Updated now
SSH_USER         Updated now
SSH_PORT         Updated now
SSH_KEY          Updated now
```

---

## 第四步：在 VPS 上准备部署目录

回到 VPS（用 deploy 用户登录），创建第三步里 `DEPLOY_PATH` 指向的目录。

### 4.1 建目录

```bash
mkdir -p /home/deploy/zhuifanhub
cd /home/deploy/zhuifanhub
```

### 4.2 上传 `docker-compose.prod.yml`

最简单的方式：从仓库直接 wget 下来。

```bash
curl -fsSL https://raw.githubusercontent.com/xiaodeng262/zhuifanhub/main/docker-compose.prod.yml -o docker-compose.prod.yml
```

> 如果你的仓库是私有的，curl 会 404。两种解决办法：
> ① 在本地 `scp docker-compose.prod.yml deploy@your-server-ip:/home/deploy/zhuifanhub/`
> ② 或者把整个仓库 git clone 到服务器再 cd 进去用

### 4.3 创建 `.env` 文件

`.env` 是部署的核心配置文件，里面保存了所有密钥与连接信息，**绝对不要 commit 进 git**。

```bash
nano .env       # 用 nano；不会用 vim 也可以用它
```

把下面内容贴进去，**按注释一项项改成你自己的值**：

```env
# ============================================================
# 镜像引用 - 必填
# ============================================================
# 你的 GitHub 用户名（用来拼镜像地址 ghcr.io/<owner>/zhuifanhub）
GHCR_OWNER=xiaodeng262

# 当前要部署的镜像 tag，首次随便填 latest 即可
# 之后 GitHub Actions 会自动改写这一行为具体的 sha
IMAGE_TAG=latest

# ============================================================
# Postgres - 必填
# ============================================================
POSTGRES_USER=zhuifanhub
# ⚠️ 用强随机密码！生成命令：openssl rand -base64 24
POSTGRES_PASSWORD=请改成随机密码请改成随机密码
POSTGRES_DB=zhuifanhub

# ============================================================
# 应用配置 - 必填
# ============================================================
# 对外访问的完整 URL（带 https://），用于 OG / sitemap / 邮件链接
NEXT_PUBLIC_SITE_URL=https://zhuifanhub.com

# Session 签名密钥，必须是 32 字符以上随机串
# 生成命令：openssl rand -hex 32
AUTH_SECRET=请改成随机密钥请改成随机密钥请改成随机密钥请改成

# 管理员用户名（多个用逗号分隔），匹配的用户首次登录会被标记为 admin
ADMIN_USERNAMES=admin

# ============================================================
# S3 兼容对象存储 - 必填（启用上传时）
# ============================================================
S3_ENDPOINT=https://你的桶域名.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=zhuifanhub
S3_ACCESS_KEY=你的-access-key
S3_SECRET_KEY=你的-secret-key
# 可选：CDN 前缀；缺省时拼 {endpoint}/{bucket}
# S3_PUBLIC_BASE=https://cdn.zhuifanhub.com
```

> 不会生成随机串？在本地或服务器执行：
> ```
> openssl rand -hex 32          # 给 AUTH_SECRET 用
> openssl rand -base64 24       # 给 POSTGRES_PASSWORD 用
> ```

### 4.4 锁紧权限

`.env` 里有数据库密码和 Session 密钥，必须只让属主能读：

```bash
chmod 600 .env
ls -l .env
# 应该看到：-rw-------  1 deploy deploy  ... .env
```

### 4.5 在服务器上 docker login 一次

让服务器记住 GHCR 凭证，后续 `compose pull` 就不用再登录：

```bash
echo "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" | docker login ghcr.io -u xiaodeng262 --password-stdin
```

预期输出 `Login Succeeded`。

---

## 第五步：触发首次部署

到目前为止：
- ✅ 服务器上有了 `docker-compose.prod.yml` 和 `.env`
- ✅ GitHub 上配齐了 7 个 Secret
- ✅ Actions 里的 workflow 已经在仓库里（`.github/workflows/deploy.yml`）

可以触发了。两种方式：

### 方式 A：推一次代码（推荐）

在本地随便改个文件，比如 `README.md` 加个空行，提交并推送：

```bash
git add README.md
git commit -m "trigger first deploy"
git push
```

### 方式 B：在 Actions 页面手动跑

1. 浏览器打开 <https://github.com/xiaodeng262/zhuifanhub/actions>
2. 左侧选 **deploy**
3. 右上角 **Run workflow** → **Run workflow**

### 5.1 看 Actions 跑

打开 Actions 页面，会看到一个新的运行任务，点进去能看到两个 job：

```
✅ build-and-push    (大概 3~6 分钟，首次会久一点)
✅ deploy            (大概 30 秒~2 分钟)
```

**首次构建会比较慢**，因为：
- 拉基础镜像 `node:20-slim`
- 全量 `npm ci` 装依赖
- 全量 `next build`

之后的构建因为有 cache，会快很多（通常 1~2 分钟）。

### 5.2 部署阶段在干嘛

`deploy` job 的日志里你能看到这样的输出：

```
[1] health=starting
[2] health=starting
...
[8] health=healthy
```

看到 `health=healthy` 就说明：镜像拉下来了 → 容器起来了 → Next.js 服务也起来了 → healthcheck 探测通过。

---

## 第六步：验证部署成功

### 6.1 在服务器上看容器状态

```bash
cd /home/deploy/zhuifanhub
docker compose -f docker-compose.prod.yml ps
```

应该看到：

```
NAME                 IMAGE                                       STATUS              PORTS
zhuifanhub-app       ghcr.io/xiaodeng262/zhuifanhub:sha-xxxxxxx  Up (healthy)        127.0.0.1:3000->3000/tcp
zhuifanhub-postgres  postgres:16-alpine                          Up (healthy)        5432/tcp
```

注意 `Up (healthy)`——两个 healthy 才算 OK。

### 6.2 本机 curl 试一下

```bash
curl -I http://127.0.0.1:3000/
```

预期：

```
HTTP/1.1 200 OK
...
```

如果是 200，恭喜，应用已经在跑了。剩下的就是把外网流量接进来。

### 6.3 看应用日志

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

正常日志开头会有：

```
[entrypoint] running prisma migrate deploy ...
... 1 migration found in prisma/migrations
... All migrations have been successfully applied.
[entrypoint] starting next server ...
   ▲ Next.js 15.x.x
   - Local:        http://0.0.0.0:3000
 ✓ Ready in xxxms
```

---

## 第七步：配置 nginx 反向代理 + HTTPS

`docker-compose.prod.yml` 默认把 app 绑定在 `127.0.0.1:3000`，**外网访问不到**。这是故意的安全设计：必须经过宿主机 nginx，方便加 HTTPS、限速、防火墙。

### 7.1 安装 nginx 与 certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 7.2 写 nginx 站点配置

```bash
sudo nano /etc/nginx/sites-available/zhuifanhub
```

贴入：

```nginx
server {
    listen 80;
    server_name zhuifanhub.com www.zhuifanhub.com;

    # 上传文件大一点，否则封面图会被 nginx 拦掉
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}
```

把 `zhuifanhub.com` 换成你的域名。

### 7.3 启用并 reload

```bash
sudo ln -s /etc/nginx/sites-available/zhuifanhub /etc/nginx/sites-enabled/
sudo nginx -t                  # 检查配置语法，看到 "syntax is ok" 才继续
sudo systemctl reload nginx
```

### 7.4 申请 HTTPS 证书

**前提**：你的域名 A 记录已经解析到这台 VPS 的 IP，且 DNS 已经生效（`ping zhuifanhub.com` 能 ping 到 VPS）。

```bash
sudo certbot --nginx -d zhuifanhub.com -d www.zhuifanhub.com
```

按提示输入邮箱、同意条款、选 `2`（强制 HTTPS 跳转）。certbot 会自动改 nginx 配置加上证书部分，并且会注册一个 cron 任务定期续期。

完成后浏览器打开 `https://zhuifanhub.com`，应该能看到追番向导首页。🎉

---

## 第八步：日常运维

### 看实时日志

```bash
cd /home/deploy/zhuifanhub
docker compose -f docker-compose.prod.yml logs -f app
```

按 `Ctrl+C` 退出。

### 重启应用（不动数据库）

```bash
docker compose -f docker-compose.prod.yml restart app
```

### 进容器调试

```bash
# 进 app 容器
docker compose -f docker-compose.prod.yml exec app sh

# 进 postgres 容器跑 SQL
docker compose -f docker-compose.prod.yml exec postgres psql -U zhuifanhub -d zhuifanhub
```

### 备份数据库

强烈建议加个 cron 每天导出一次：

```bash
mkdir -p /home/deploy/backups

# 测试一次
docker compose -f /home/deploy/zhuifanhub/docker-compose.prod.yml exec -T postgres \
  pg_dump -U zhuifanhub zhuifanhub | gzip > /home/deploy/backups/test.sql.gz
ls -lh /home/deploy/backups/test.sql.gz       # 看到几 MB 的文件就 OK
```

加 cron（每天凌晨 3 点备份，保留 7 天）：

```bash
crontab -e
```

末尾追加：

```cron
0 3 * * * cd /home/deploy/zhuifanhub && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U zhuifanhub zhuifanhub | gzip > /home/deploy/backups/db-$(date +\%F).sql.gz && find /home/deploy/backups -name "db-*.sql.gz" -mtime +7 -delete
```

### 回滚到上一个版本

1. 进 GitHub Actions 页面，找到上一个跑成功的 `deploy` 任务
2. 看 build-and-push 步骤里的 tag，记下形如 `sha-abc1234`
3. 浏览器打开 Actions → deploy → **Run workflow**
4. **image_tag** 输入框填 `sha-abc1234`
5. 点 Run，跳过构建直接部署旧镜像

### 查看磁盘占用 / 清理无用镜像

```bash
docker system df               # 看占用
docker image prune -f          # 清理悬空镜像（workflow 已自动跑）
```

---

## 🆘 常见问题

### Q1：Actions 里 `build-and-push` 红了，提示 `npm ci` 失败

通常是依赖锁文件不一致。本地执行：

```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: refresh package-lock"
git push
```

### Q2：`build-and-push` 成功但 `deploy` 红了，提示 `Permission denied (publickey)`

`SSH_KEY` 没贴对。检查：
- 是不是把**公钥** `*.pub` 贴进去了？应该贴**私钥**
- 首尾两行 `-----BEGIN/END OPENSSH PRIVATE KEY-----` 是不是漏了
- 末尾有没有保留换行
- `SSH_USER` 跟你授权 `authorized_keys` 时用的用户是不是同一个

### Q3：`deploy` 里报 `Error: pull access denied for ghcr.io/.../zhuifanhub`

服务器拉镜像权限问题。逐项排查：
1. `GHCR_PULL_TOKEN` 是不是过期了？去 <https://github.com/settings/tokens> 看
2. PAT 创建时勾的是 `read:packages` 吗？
3. 仓库的 Package 可见性：去 <https://github.com/users/xiaodeng262/packages/container/zhuifanhub/settings>，下拉到底部 **Manage Actions access**，确保 `xiaodeng262/zhuifanhub` 仓库被加入并给了 `Write` 权限

### Q4：`deploy` 里报 `app failed to become healthy within 60s`

应用启动了但 healthcheck 没过。SSH 上服务器看日志：

```bash
docker compose -f docker-compose.prod.yml logs --tail=200 app
```

最常见的原因：
- `.env` 里 `DATABASE_URL` 写错或 `POSTGRES_PASSWORD` 跟 compose 里不一致 → 应用连不上库
- `AUTH_SECRET` 没填或太短（< 32 字符）→ 启动校验失败
- 第一次跑迁移耗时较长 → 把 `.github/workflows/deploy.yml` 里 `for i in $(seq 1 30)` 改大点

### Q5：浏览器访问 502 Bad Gateway

nginx 转到了 3000 但容器没在跑，或者绑错了 IP。检查：

```bash
# 容器在跑吗？
docker compose -f docker-compose.prod.yml ps

# 端口绑对了吗？应该看到 127.0.0.1:3000
docker compose -f docker-compose.prod.yml port app 3000

# nginx 配置 proxy_pass 是不是写的 http://127.0.0.1:3000
```

### Q6：上传图片报错 / 封面 404

S3 配置不对。逐项检查 `.env` 里的 5 个 `S3_*` 变量；常见坑：
- Cloudflare R2 的 `S3_REGION` 必须填 `auto`
- AWS S3 的 endpoint 不要带 bucket 名
- 阿里云 OSS 的 endpoint 形如 `https://oss-cn-hangzhou.aliyuncs.com`，不带 bucket
- 桶要开启**公开读**或者 `S3_PUBLIC_BASE` 配 CDN

### Q7：我想本地直接 `docker build` 试一下，不想每次推 GitHub

```bash
docker build -t zhuifanhub:local .

# 跑起来连本地的 postgres
docker run --rm -p 3000:3000 \
  --env-file .env.local \
  --add-host=host.docker.internal:host-gateway \
  -e DATABASE_URL="postgresql://zhuifanhub:zhuifanhub_dev@host.docker.internal:5433/zhuifanhub" \
  zhuifanhub:local
```

---

## 📋 附录：完整步骤一页流

打勾确认每一步都做了：

- [ ] **第一步** 在 VPS 上创建 deploy 用户并加入 docker 组
- [ ] **第一步** 在 VPS 上以 deploy 身份生成 `~/.ssh/zhuifanhub_deploy` 密钥对
- [ ] **第一步** 把公钥追加到 `~/.ssh/authorized_keys`
- [ ] **第一步** `cat ~/.ssh/zhuifanhub_deploy` 复制好私钥备用
- [ ] **第一步** deploy 用户跑 `docker --version` 通过
- [ ] **第二步** 在 GitHub 创建 PAT（仅勾 `read:packages`）
- [ ] **第二步** 在 VPS 上 `docker login ghcr.io` 测试通过
- [ ] **第三步** GitHub 仓库添加 7 个 Secret
- [ ] **第四步** VPS 上建好 `/home/deploy/zhuifanhub` 目录
- [ ] **第四步** `docker-compose.prod.yml` 已上传
- [ ] **第四步** `.env` 已写好且 `chmod 600`
- [ ] **第五步** 推一次代码或手动 Run workflow
- [ ] **第五步** Actions 两个 job 都绿
- [ ] **第六步** `docker compose ps` 两个容器都 healthy
- [ ] **第六步** `curl -I http://127.0.0.1:3000/` 返回 200
- [ ] **第七步** nginx 装好并配置完
- [ ] **第七步** certbot 申请到 HTTPS 证书
- [ ] **第七步** 浏览器能访问 `https://你的域名`
- [ ] **第八步** crontab 配好每日数据库备份

每一项都打钩 = 部署完成 ✅
