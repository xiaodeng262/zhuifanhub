import { NextResponse } from "next/server";
import { createReport } from "@/lib/store/reports";
import { findResourceById } from "@/lib/store/resources";
import { requireUser } from "@/lib/auth/admin";
import type { ContentReason } from "@/lib/reports";

/*
 * 内容举报
 *
 * POST /api/resources/[id]/report   需登录
 *   body: { reason: ContentReason, note?: string }
 *
 * 与 /feedback 区分：
 * - /report 处理内容违规（广告 / 灌水 / 重复 / 违规 / 其他）
 * - /feedback 处理链接失效
 * 两者落到同一张 reports 表，用 kind 区分
 */

export const runtime = "nodejs";

const VALID_REASONS: readonly ContentReason[] = [
  "ad",
  "spam",
  "duplicate",
  "illegal",
  "other",
];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;

    const resource = await findResourceById(id);
    if (!resource || resource.status === "removed") {
      return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    }

    const body = (await req.json()) as {
      reason?: ContentReason;
      note?: string;
    };

    const reason = body.reason;
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "请选择举报原因" }, { status: 400 });
    }

    const note = String(body.note ?? "").trim();
    if (note.length > 500) {
      return NextResponse.json(
        { error: "备注不能超过 500 字" },
        { status: 400 }
      );
    }

    const report = await createReport({
      kind: "content",
      resourceId: id,
      reporterId: user.id,
      reporter: user.username,
      reason,
      note: note || undefined,
    });

    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[report.POST] failed:", err);
    return NextResponse.json(
      { error: "举报提交失败" },
      { status: 500 }
    );
  }
}
