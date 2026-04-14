import { NextResponse } from "next/server";
import { createReport } from "@/lib/store/reports";
import { findResourceById } from "@/lib/store/resources";
import { requireUser } from "@/lib/auth/admin";

/*
 * 失效反馈
 *
 * POST /api/resources/[id]/feedback   需登录
 *   body: { deadLink?: string, note?: string }
 *
 * 写入时 kind=dead，落到同一张 reports 表。
 * deadLink 与 note 都是可选的——用户可能只想告诉管理员"整条资源都挂了"。
 */

export const runtime = "nodejs";

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
      deadLink?: string;
      note?: string;
    };

    const deadLink = String(body.deadLink ?? "").trim();
    const note = String(body.note ?? "").trim();

    // 把 deadLink 合并到 note 里保存，避免 ReportRecord 新增字段
    // 后台展示足以分辨；如果将来要做详细数据分析再拆字段
    let combinedNote = note;
    if (deadLink) {
      combinedNote = combinedNote
        ? `[失效链接] ${deadLink}\n${combinedNote}`
        : `[失效链接] ${deadLink}`;
    }

    if (combinedNote.length > 500) {
      return NextResponse.json(
        { error: "反馈内容不能超过 500 字" },
        { status: 400 }
      );
    }

    const report = await createReport({
      kind: "dead",
      resourceId: id,
      reporterId: user.id,
      reporter: user.username,
      note: combinedNote || undefined,
    });

    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[feedback.POST] failed:", err);
    return NextResponse.json(
      { error: "反馈提交失败" },
      { status: 500 }
    );
  }
}
