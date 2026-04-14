import { prisma } from "@/lib/db";
import type { Comment as CommentRow } from "@prisma/client";
import { incrementResourceStat } from "./resources";
import type { Comment } from "@/lib/types";

/*
 * 评论存储层（Prisma 版）
 *
 * 对外仍返回旧 Comment interface 形状，上游组件不必改动
 * parentId 在 Prisma 里是 nullable，对外转 undefined 与旧 JSON 保持一致
 */

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    resourceId: row.resourceId,
    authorId: row.authorId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    parentId: row.parentId ?? undefined,
  };
}

/*
 * 按资源列出评论，按发布时间升序
 */
export async function listCommentsByResource(
  resourceId: string
): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({
    where: { resourceId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(rowToComment);
}

/*
 * 创建评论
 * - 写入后累加资源的 commentsCount
 * - 调用方传 parentId 时视为嵌套回复；不校验父评论是否存在（由 API 层做）
 */
export async function createComment(input: {
  resourceId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId?: string;
}): Promise<Comment> {
  const row = await prisma.comment.create({
    data: {
      resourceId: input.resourceId,
      authorId: input.authorId,
      authorName: input.authorName,
      body: input.body,
      parentId: input.parentId ?? null,
    },
  });
  // 计数 +1；失败不回滚
  await incrementResourceStat(input.resourceId, "comments", 1).catch(() => {});
  return rowToComment(row);
}

/*
 * 按 id 查单条，供 API 层校验父评论
 */
export async function findCommentById(
  id: string
): Promise<Comment | undefined> {
  const row = await prisma.comment.findUnique({ where: { id } });
  return row ? rowToComment(row) : undefined;
}

/*
 * 删除评论
 * - 仅作者或管理员可删
 * - 删除成功返回 true；权限不足或不存在返回 false
 * - 删除后资源评论计数 -1
 * - cascade 会顺便删掉其回复（schema 中 parent 关系配置了 Cascade）
 */
export async function deleteComment(
  id: string,
  requesterId: string,
  isAdmin: boolean
): Promise<boolean> {
  const target = await prisma.comment.findUnique({ where: { id } });
  if (!target) return false;
  if (target.authorId !== requesterId && !isAdmin) return false;
  await prisma.comment.delete({ where: { id } });
  await incrementResourceStat(target.resourceId, "comments", -1).catch(() => {});
  return true;
}
