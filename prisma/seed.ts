import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

/*
 * 种子脚本：把现有 .data/*.json 内容写入数据库
 *
 * 幂等策略：用 upsert 而不是 create，同一脚本跑多次不会失败
 *
 * 关键细节：
 * - 旧 resources / reports 的 authorId / reporterId 可能是 "seed"
 *   为此先写一个 id="seed" 的占位用户（passwordHash 随机值 + 禁止登录）
 * - 旧 resources 有嵌套 stats / uploader / links，按 schema 展开后写入
 * - 订单：users → resources(+links) → comments → notices → reports
 *   任何依赖 User / Resource 的表都放后面，规避外键错误
 */

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), ".data");

type JsonUser = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  role?: "user" | "admin";
};

type JsonResourceLink = {
  label: string;
  url: string;
  storage: string;
};

type JsonResource = {
  id: string;
  title: string;
  alias?: string;
  cover: string;
  category: string;
  kind: string;
  tags: string[];
  description: string;
  uploader: { name: string; avatar?: string };
  publishedAt: string;
  stats: { views: number; downloads: number; comments: number };
  links: JsonResourceLink[];
  year?: number;
  bounty?: number;
  authorId: string;
  status?: "published" | "removed";
  updatedAt?: string;
};

type JsonComment = {
  id: string;
  resourceId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  parentId?: string;
};

type JsonNotice = {
  id: string;
  level: string;
  title: string;
  body: string;
  date: string;
  createdAt: string;
};

type JsonReport = {
  id: string;
  kind: string;
  resourceId: string;
  resourceTitle: string;
  reporter: string;
  reporterId: string;
  createdAt: string;
  status: string;
  reason?: string;
  note?: string;
};

async function readJsonSafe<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  // 1) 特殊 seed 占位用户：承载历史 authorId="seed" / reporterId="seed"
  // passwordHash 填一个永远不会被密码比对通过的字面量，杜绝实际登录
  await prisma.user.upsert({
    where: { id: "seed" },
    update: {},
    create: {
      id: "seed",
      username: "__seed__",
      passwordHash: "disabled",
      role: "user",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
  });

  // 2) 真实用户
  const users = await readJsonSafe<JsonUser[]>("users.json", []);
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        username: u.username,
        passwordHash: u.passwordHash,
        role: u.role ?? "user",
      },
      create: {
        id: u.id,
        username: u.username,
        passwordHash: u.passwordHash,
        role: u.role ?? "user",
        createdAt: new Date(u.createdAt),
      },
    });
  }
  console.log(`[seed] users: ${users.length + 1}`);

  // 3) 资源（含链接）
  const resources = await readJsonSafe<JsonResource[]>("resources.json", []);
  for (const r of resources) {
    await prisma.resource.upsert({
      where: { id: r.id },
      update: {
        title: r.title,
        alias: r.alias ?? null,
        cover: r.cover,
        category: r.category,
        kind: r.kind,
        tags: r.tags,
        description: r.description,
        uploaderName: r.uploader.name,
        uploaderAvatar: r.uploader.avatar ?? null,
        publishedAt: new Date(r.publishedAt),
        views: r.stats.views,
        downloads: r.stats.downloads,
        commentsCount: r.stats.comments,
        year: r.year ?? null,
        bounty: r.bounty ?? null,
        status: r.status ?? "published",
        authorId: r.authorId,
      },
      create: {
        id: r.id,
        title: r.title,
        alias: r.alias ?? null,
        cover: r.cover,
        category: r.category,
        kind: r.kind,
        tags: r.tags,
        description: r.description,
        uploaderName: r.uploader.name,
        uploaderAvatar: r.uploader.avatar ?? null,
        publishedAt: new Date(r.publishedAt),
        views: r.stats.views,
        downloads: r.stats.downloads,
        commentsCount: r.stats.comments,
        year: r.year ?? null,
        bounty: r.bounty ?? null,
        status: r.status ?? "published",
        authorId: r.authorId,
      },
    });

    // 链接：每次全量覆盖，避免重复插入
    await prisma.resourceLink.deleteMany({ where: { resourceId: r.id } });
    if (r.links.length > 0) {
      await prisma.resourceLink.createMany({
        data: r.links.map((l, i) => ({
          resourceId: r.id,
          label: l.label,
          url: l.url,
          storage: l.storage,
          position: i,
        })),
      });
    }
  }
  console.log(`[seed] resources: ${resources.length}`);

  // 4) 评论
  const comments = await readJsonSafe<JsonComment[]>("comments.json", []);
  for (const c of comments) {
    await prisma.comment.upsert({
      where: { id: c.id },
      update: {
        body: c.body,
        parentId: c.parentId ?? null,
      },
      create: {
        id: c.id,
        resourceId: c.resourceId,
        authorId: c.authorId,
        authorName: c.authorName,
        body: c.body,
        createdAt: new Date(c.createdAt),
        parentId: c.parentId ?? null,
      },
    });
  }
  console.log(`[seed] comments: ${comments.length}`);

  // 5) 公告
  const notices = await readJsonSafe<JsonNotice[]>("notices.json", []);
  for (const n of notices) {
    await prisma.notice.upsert({
      where: { id: n.id },
      update: {
        level: n.level,
        title: n.title,
        body: n.body,
        date: n.date,
      },
      create: {
        id: n.id,
        level: n.level,
        title: n.title,
        body: n.body,
        date: n.date,
        createdAt: new Date(n.createdAt),
      },
    });
  }
  console.log(`[seed] notices: ${notices.length}`);

  // 6) 举报
  const reports = await readJsonSafe<JsonReport[]>("reports.json", []);
  for (const r of reports) {
    await prisma.report.upsert({
      where: { id: r.id },
      update: {
        status: r.status,
        note: r.note ?? null,
      },
      create: {
        id: r.id,
        kind: r.kind,
        resourceId: r.resourceId,
        resourceTitle: r.resourceTitle,
        reporterId: r.reporterId,
        reporterName: r.reporter,
        createdAt: new Date(r.createdAt),
        status: r.status,
        reason: r.reason ?? null,
        note: r.note ?? null,
      },
    });
  }
  console.log(`[seed] reports: ${reports.length}`);

  console.log("[seed] done ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
