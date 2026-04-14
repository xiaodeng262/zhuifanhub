import { prisma } from "@/lib/db";
import { findResourceById } from "./resources";
import type { Resource } from "@/lib/types";

/*
 * 收藏关系存储层（Prisma 版）
 *
 * 表结构：复合主键 (userId, resourceId)，天然去重
 * 业务语义：
 * - collect/uncollect 均幂等
 * - 列表查询按 createdAt 倒序
 */

export async function isCollected(
  userId: string,
  resourceId: string
): Promise<boolean> {
  const row = await prisma.collection.findUnique({
    where: { userId_resourceId: { userId, resourceId } },
  });
  return row !== null;
}

/*
 * 收藏资源
 * 幂等：upsert 保证重复调用不报错
 */
export async function collect(
  userId: string,
  resourceId: string
): Promise<void> {
  await prisma.collection.upsert({
    where: { userId_resourceId: { userId, resourceId } },
    update: {},
    create: { userId, resourceId },
  });
}

/*
 * 取消收藏
 * 幂等：用 deleteMany 避免不存在时抛错
 */
export async function uncollect(
  userId: string,
  resourceId: string
): Promise<void> {
  await prisma.collection.deleteMany({
    where: { userId, resourceId },
  });
}

/*
 * 获取用户的所有收藏资源
 * 按收藏时间倒序（最近收藏的在前），自动跳过被软删除的资源
 *
 * 实现细节：先按 collection 排序拿到 resourceId 列表，再通过 findResourceById
 * 逐条查得完整 Resource 对象。一次 join 也能做，但要重复 rowToResource 逻辑；
 * 走现有函数省代码，MVP 可接受性能。
 */
export async function listCollectionsByUser(
  userId: string
): Promise<Resource[]> {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { resourceId: true },
  });
  const out: Resource[] = [];
  for (const { resourceId } of rows) {
    const r = await findResourceById(resourceId);
    if (r && r.status !== "removed") out.push(r);
  }
  return out;
}
