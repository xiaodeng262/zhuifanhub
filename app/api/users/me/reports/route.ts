import { NextResponse } from "next/server";
import { listReportsByUser } from "@/lib/store/reports";
import { requireUser } from "@/lib/auth/admin";

/*
 * 当前用户自己提交过的反馈 / 举报列表
 *
 * GET /api/users/me/reports   需登录
 * 返回 { items: ReportRecord[] }，按提交时间倒序
 *
 * 为什么要做这个接口：
 * - 用户提交「失效反馈」之后看不到任何进度，体验断层
 * - 个人中心的「我的反馈」tab 通过它展示处理状态（待处理 / 已处理 / 已驳回）
 * - 与 /api/admin/reports 严格区分：管理员看所有，用户只看自己的
 */

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await listReportsByUser(user.id);
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[users.me.reports.GET] failed:", err);
    return NextResponse.json(
      { error: "加载反馈记录失败" },
      { status: 500 }
    );
  }
}
