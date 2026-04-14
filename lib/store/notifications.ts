import { prisma } from "@/lib/db";
import type { Notification as NotificationRow, Prisma } from "@prisma/client";

/*
 * 通知存储层（Prisma 版，新增模块）
 *
 * 业务动机：
 * - 别人回复了你、或 @ 了你，需要让你在 Header 铃铛看到提示
 * - MVP 仅支持两种 type："reply"（被回复）、"mention"（被 @）
 *
 * 设计要点：
 * - userId 为接收者；actor 为触发者
 * - resourceId / commentId 均可空，留给未来的系统通知（公告等）
 * - snippet 限制 140 字符，避免通知面板里渲染巨型评论
 * - 创建时对 (userId, actorId) 的自我通知做兜底跳过：永远不给自己发通知
 */

export type NotificationType = "reply" | "mention";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  resourceId: string | null;
  commentId: string | null;
  snippet: string;
  read: boolean;
  createdAt: string;
}

function rowToNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type as NotificationType,
    actorId: row.actorId,
    actorName: row.actorName,
    resourceId: row.resourceId,
    commentId: row.commentId,
    snippet: row.snippet,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}

// 140 字符截断；不把多字节字符切半
function makeSnippet(body: string): string {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > 140 ? clean.slice(0, 140) + "…" : clean;
}

/*
 * 创建通知
 * - 自我触发静默跳过（不是错误，不该打断主流程）
 * - 对 actor / recipient 做最小校验：都必须是存在的 user，否则外键会抛错
 */
export async function createNotification(input: {
  userId: string;
  actorId: string;
  actorName: string;
  type: NotificationType;
  resourceId?: string | null;
  commentId?: string | null;
  body: string;
}): Promise<NotificationItem | null> {
  if (input.userId === input.actorId) return null;
  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      actorId: input.actorId,
      actorName: input.actorName,
      type: input.type,
      resourceId: input.resourceId ?? null,
      commentId: input.commentId ?? null,
      snippet: makeSnippet(input.body),
    },
  });
  return rowToNotification(row);
}

/*
 * 批量创建通知：mention 场景下一条评论可能同时 @ 多个用户
 * 用 createMany 一次提交，减少数据库往返
 */
export async function createNotificationsBulk(
  items: Array<{
    userId: string;
    actorId: string;
    actorName: string;
    type: NotificationType;
    resourceId?: string | null;
    commentId?: string | null;
    body: string;
  }>
): Promise<number> {
  const rows: Prisma.NotificationCreateManyInput[] = items
    .filter((i) => i.userId !== i.actorId)
    .map((i) => ({
      userId: i.userId,
      actorId: i.actorId,
      actorName: i.actorName,
      type: i.type,
      resourceId: i.resourceId ?? null,
      commentId: i.commentId ?? null,
      snippet: makeSnippet(i.body),
    }));
  if (rows.length === 0) return 0;
  const result = await prisma.notification.createMany({ data: rows });
  return result.count;
}

/*
 * 列出某用户的通知
 * 默认返回最新 20 条，按创建时间倒序
 * 可选仅返回未读
 */
export async function listNotificationsByUser(
  userId: string,
  opts: { limit?: number; onlyUnread?: boolean } = {}
): Promise<NotificationItem[]> {
  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...(opts.onlyUnread ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 20,
  });
  return rows.map(rowToNotification);
}

/*
 * 未读数
 * 热路径：Header 铃铛轮询或首次拉取时调用
 */
export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/*
 * 标记通知为已读
 * - 不传 id → 把该用户的所有未读通知一次性标记已读
 * - 传 id[] → 只标记指定条目（并再次校验 userId，避免跨用户越权）
 * 返回被更新的条目数
 */
export async function markAsRead(
  userId: string,
  ids?: string[]
): Promise<number> {
  if (ids && ids.length > 0) {
    const res = await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true },
    });
    return res.count;
  }
  const res = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return res.count;
}
