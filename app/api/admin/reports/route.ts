import { NextResponse } from "next/server";
import { listReports, reportStats } from "@/lib/store/reports";
import { requireAdmin } from "@/lib/auth/admin";
import type { ReportKind, ReportStatus } from "@/lib/reports";

/*
 * 后台举报列表
 *
 * GET /api/admin/reports?kind=&status=   仅管理员
 *
 * 返回 items + stats，一次请求就能渲染整页
 * 非管理员返回 403（requireAdmin 抛）
 */

export const runtime = "nodejs";

const VALID_KINDS: readonly ReportKind[] = ["content", "dead"];
const VALID_STATUS: readonly ReportStatus[] = [
  "pending",
  "processing",
  "resolved",
  "rejected",
];

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") as ReportKind | null;
    const status = url.searchParams.get("status") as ReportStatus | null;

    const [items, stats] = await Promise.all([
      listReports({
        kind: kind && VALID_KINDS.includes(kind) ? kind : undefined,
        status: status && VALID_STATUS.includes(status) ? status : undefined,
      }),
      reportStats(),
    ]);

    return NextResponse.json({ items, stats });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin.reports.GET] failed:", err);
    return NextResponse.json(
      { error: "加载举报列表失败" },
      { status: 500 }
    );
  }
}
