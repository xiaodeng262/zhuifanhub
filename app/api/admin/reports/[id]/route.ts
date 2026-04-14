import { NextResponse } from "next/server";
import { updateReportStatus } from "@/lib/store/reports";
import { requireAdmin } from "@/lib/auth/admin";
import type { ReportStatus } from "@/lib/reports";

/*
 * 更新单条举报状态
 *
 * PATCH /api/admin/reports/[id]   仅管理员
 *   body: { status: ReportStatus }
 *
 * 返回更新后的记录；不存在返回 404
 */

export const runtime = "nodejs";

const VALID_STATUS: readonly ReportStatus[] = [
  "pending",
  "processing",
  "resolved",
  "rejected",
];

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;

    const body = (await req.json()) as { status?: ReportStatus };
    const status = body.status;
    if (!status || !VALID_STATUS.includes(status)) {
      return NextResponse.json(
        { error: "请提供有效的状态" },
        { status: 400 }
      );
    }

    const updated = await updateReportStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: "该条记录不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin.reports.PATCH] failed:", err);
    return NextResponse.json(
      { error: "更新失败，请重试" },
      { status: 500 }
    );
  }
}
