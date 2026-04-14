import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Category, PostKind, Resource, ResourceLink } from "@/lib/types";

/*
 * 资源存储层（Prisma 版）
 *
 * 迁移要点：
 * - 对外仍返回旧的 Resource interface 形状（stats / uploader / links 嵌套），避免组件改动
 * - Prisma 侧 stats 展开为 views/downloads/commentsCount 三列；uploader 展开为 uploaderName/uploaderAvatar
 * - publishedAt/updatedAt 在返回时 toISOString()，与原 JSON store 保持一致
 * - 查询始终 include links，按 position 升序，保留发布时的链接顺序
 */

type ResourceRow = Prisma.ResourceGetPayload<{
  include: { links: true };
}>;

// Prisma 行 → 旧 Resource interface 的适配器
function rowToResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    title: row.title,
    alias: row.alias ?? undefined,
    cover: row.cover,
    category: row.category as Category,
    kind: row.kind as PostKind,
    tags: row.tags,
    description: row.description,
    uploader: {
      name: row.uploaderName,
      avatar: row.uploaderAvatar ?? undefined,
    },
    publishedAt: row.publishedAt.toISOString(),
    stats: {
      views: row.views,
      downloads: row.downloads,
      comments: row.commentsCount,
    },
    links: [...row.links]
      .sort((a, b) => a.position - b.position)
      .map<ResourceLink>((l) => ({
        label: l.label,
        url: l.url,
        storage: l.storage as ResourceLink["storage"],
      })),
    year: row.year ?? undefined,
    bounty: row.bounty ?? undefined,
    authorId: row.authorId,
    status: row.status as Resource["status"],
    updatedAt: row.updatedAt.toISOString(),
  };
}

/*
 * 列表查询
 *
 * 过滤语义与旧版一致：category / kind / authorId / q / 分页
 * q 走 Postgres 的 ilike 多列匹配；tags 数组用 `array_to_string` 视同字符串参与匹配
 */
export async function listResources(
  opts: {
    category?: Category;
    q?: string;
    kind?: PostKind;
    authorId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{
  items: Resource[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const where: Prisma.ResourceWhereInput = {
    status: { not: "removed" },
  };
  if (opts.category) where.category = opts.category;
  if (opts.kind) where.kind = opts.kind;
  if (opts.authorId) where.authorId = opts.authorId;
  if (opts.q) {
    const needle = opts.q.trim();
    if (needle) {
      // Postgres ilike 不区分大小写；多字段 OR 匹配
      where.OR = [
        { title: { contains: needle, mode: "insensitive" } },
        { alias: { contains: needle, mode: "insensitive" } },
        { description: { contains: needle, mode: "insensitive" } },
        { tags: { has: needle } },
      ];
    }
  }

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 20;

  const total = await prisma.resource.count({ where });

  const rows = await prisma.resource.findMany({
    where,
    include: { links: true },
    orderBy: { publishedAt: "desc" },
    // pageSize === 0：返回全部（首页 SSR 用），不下发 skip/take
    ...(pageSize === 0
      ? {}
      : { skip: (page - 1) * pageSize, take: pageSize }),
  });

  return {
    items: rows.map(rowToResource),
    total,
    page,
    pageSize,
  };
}

/*
 * 按 id 查询单条
 * 不过滤软删除：详情页可能要显示"已下架"，由调用方决定
 */
export async function findResourceById(
  id: string
): Promise<Resource | undefined> {
  const row = await prisma.resource.findUnique({
    where: { id },
    include: { links: true },
  });
  return row ? rowToResource(row) : undefined;
}

/*
 * 相关资源：同分类下其他未下架资源，按时间倒序取 limit 条
 */
export async function relatedResources(
  id: string,
  limit: number = 3
): Promise<Resource[]> {
  const self = await prisma.resource.findUnique({
    where: { id },
    select: { category: true },
  });
  if (!self) return [];
  const rows = await prisma.resource.findMany({
    where: {
      id: { not: id },
      status: { not: "removed" },
      category: self.category,
    },
    include: { links: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map(rowToResource);
}

/*
 * 创建资源
 * storage 仍按 URL 推断，与原逻辑一致
 */
export type CreateResourceInput = {
  title: string;
  alias?: string;
  cover: string;
  category: Category;
  kind: PostKind;
  tags: string[];
  description: string;
  links: Array<{ label: string; url: string }>;
  year?: number;
  bounty?: number;
  authorId: string;
  authorName: string;
};

export async function createResource(
  input: CreateResourceInput
): Promise<Resource> {
  const id = randomUUID();
  const row = await prisma.resource.create({
    data: {
      id,
      title: input.title,
      alias: input.alias ?? null,
      cover: input.cover,
      category: input.category,
      kind: input.kind,
      tags: input.tags,
      description: input.description,
      uploaderName: input.authorName,
      authorId: input.authorId,
      publishedAt: new Date(),
      status: "published",
      year: input.year ?? null,
      bounty: input.bounty ?? null,
      links: {
        create: input.links.map((l, i) => ({
          label: l.label,
          url: l.url,
          storage: inferStorage(l.url),
          position: i,
        })),
      },
    },
    include: { links: true },
  });
  return rowToResource(row);
}

/*
 * 数值字段累加（views / downloads / commentsCount）
 * delta 可以为负（评论删除等回滚场景）；结果下限 0
 */
export async function incrementResourceStat(
  id: string,
  field: "views" | "downloads" | "comments",
  delta: number = 1
): Promise<void> {
  const column = field === "comments" ? "commentsCount" : field;
  // 先读出当前值，手动 clamp 到 0，避免 Prisma increment 直接写入负数
  const row = await prisma.resource.findUnique({
    where: { id },
    select: { views: true, downloads: true, commentsCount: true },
  });
  if (!row) return;
  const current = row[column as keyof typeof row];
  const next = Math.max(0, current + delta);
  await prisma.resource.update({
    where: { id },
    data: { [column]: next },
  });
}

/*
 * 软删除：标记 status = removed
 */
export async function softRemoveResource(id: string): Promise<void> {
  await prisma.resource
    .update({ where: { id }, data: { status: "removed" } })
    .catch(() => {
      // 资源不存在时静默失败，保持与原实现一致
    });
}

// 内部：从 URL 推断存储类型
function inferStorage(url: string): ResourceLink["storage"] {
  const u = url.toLowerCase();
  if (u.startsWith("magnet:")) return "magnet";
  if (/pan\.baidu|aliyundrive|alipan|115\.com|quark|xunlei|lanzou/.test(u)) {
    return "pan";
  }
  if (/bangumi|mikan|dmhy|nyaa|acg\.rip/.test(u)) return "site";
  return "online";
}
