import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { Report as ReportRow, Prisma } from "@prisma/client";
import type {
  ContentReason,
  ReportKind,
  ReportRecord,
  ReportStatus,
} from "@/lib/reports";

/*
 * 举报 / 失效反馈存储层（Prisma 版）
 *
 * 数据表：Report（content + dead 合并）
 * 冗余字段 resourceTitle / reporterName 与旧实现一致，避免列表渲染频繁 join
 *
 * 为什么 reporter 字段改名为 reporterName 落库：
 * - Prisma 更推荐语义清晰的字段名
 * - 对外仍以 `reporter` 导出，保持 API 层形状不变
 */

function rowToReport(row: ReportRow): ReportRecord {
  return {
    id: row.id,
    kind: row.kind as ReportKind,
    resourceId: row.resourceId,
    resourceTitle: row.resourceTitle,
    reporter: row.reporterName,
    reporterId: row.reporterId,
    createdAt: row.createdAt.toISOString(),
    status: row.status as ReportStatus,
    reason: (row.reason ?? undefined) as ContentReason | undefined,
    note: row.note ?? undefined,
  };
}

/*
 * 创建举报或失效反馈
 * - 自动从 resources 表回查 resourceTitle，前端无需传
 */
export async function createReport(input: {
  kind: ReportKind;
  resourceId: string;
  reporterId: string;
  reporter: string;
  reason?: ContentReason;
  note?: string;
}): Promise<ReportRecord> {
  // 回查资源标题；资源丢失时用占位符
  const resource = await prisma.resource.findUnique({
    where: { id: input.resourceId },
    select: { title: true },
  });
  const resourceTitle = resource?.title ?? "未知资源";

  const row = await prisma.report.create({
    data: {
      id: randomUUID(),
      kind: input.kind,
      resourceId: input.resourceId,
      resourceTitle,
      reporterId: input.reporterId,
      reporterName: input.reporter,
      status: "pending",
      reason: input.reason ?? null,
      note: input.note ?? null,
    },
  });
  return rowToReport(row);
}

/*
 * 列出举报记录
 * 按 kind / status 过滤；创建时间倒序
 */
export async function listReports(
  opts: { kind?: ReportKind; status?: ReportStatus } = {}
): Promise<ReportRecord[]> {
  const where: Prisma.ReportWhereInput = {};
  if (opts.kind) where.kind = opts.kind;
  if (opts.status) where.status = opts.status;
  const rows = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToReport);
}

/*
 * 列出某个用户自己提交过的所有反馈 / 举报
 * reporterId="seed" 是种子占位，真实用户天然查不到，无需额外排除
 */
export async function listReportsByUser(
  userId: string
): Promise<ReportRecord[]> {
  const rows = await prisma.report.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToReport);
}

/*
 * 更新举报状态
 * 记录不存在时返回 undefined
 */
export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<ReportRecord | undefined> {
  try {
    const row = await prisma.report.update({
      where: { id },
      data: { status },
    });
    return rowToReport(row);
  } catch {
    return undefined;
  }
}

/*
 * 顶部卡片统计
 */
export async function reportStats(): Promise<{
  total: number;
  pending: number;
  content: number;
  dead: number;
}> {
  const [total, pending, content, dead] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { kind: "content" } }),
    prisma.report.count({ where: { kind: "dead" } }),
  ]);
  return { total, pending, content, dead };
}
