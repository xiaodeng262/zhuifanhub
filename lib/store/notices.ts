import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { Notice as NoticeRow } from "@prisma/client";
import type { Notice } from "@/lib/types";

/*
 * 公告存储层（Prisma 版）
 *
 * 排序规则：置顶优先 + createdAt 倒序，与原 JSON 实现一致
 * 由于 SQL 侧没有"优先级"字段，置顶排序用 CASE WHEN 通过 Prisma orderBy 数组实现
 */

function rowToNotice(row: NoticeRow): Notice {
  return {
    id: row.id,
    level: row.level as Notice["level"],
    title: row.title,
    body: row.body,
    date: row.date,
    createdAt: row.createdAt.toISOString(),
  };
}

/*
 * 列出全部公告
 *
 * 实现细节：Prisma 原生不支持 CASE WHEN，做法是：
 * - 拉全量公告（MVP 数据量小）
 * - 在内存中按 pinned 优先 + createdAt 倒序排好再返回
 * 后续数据量上来可以改为原生 SQL 或加 priority 列
 */
export async function listNotices(): Promise<Notice[]> {
  const rows = await prisma.notice.findMany();
  return rows
    .map(rowToNotice)
    .sort((a, b) => {
      if (a.level === "pinned" && b.level !== "pinned") return -1;
      if (a.level !== "pinned" && b.level === "pinned") return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

/*
 * 创建公告（管理员后台使用）
 * date 自动从 createdAt 取日期部分
 */
export async function createNotice(input: {
  title: string;
  body: string;
  level: Notice["level"];
}): Promise<Notice> {
  const now = new Date();
  const row = await prisma.notice.create({
    data: {
      id: randomUUID(),
      level: input.level,
      title: input.title,
      body: input.body,
      date: now.toISOString().slice(0, 10),
      createdAt: now,
    },
  });
  return rowToNotice(row);
}
