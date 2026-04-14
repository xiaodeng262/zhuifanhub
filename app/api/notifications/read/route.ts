import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/admin";
import { markAsRead } from "@/lib/store/notifications";

/*
 * POST /api/notifications/read
 *
 * 标记通知已读。
 * body:
 *   - { ids: string[] }  标记指定条目已读（仅当前用户拥有的条目生效）
 *   - {}                 不传 ids → 一次性全部已读
 *
 * 返回：{ updated: number }
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    // 允许空 body：直接 "全部已读"
    const raw = await req.text();
    const payload = raw ? (JSON.parse(raw) as { ids?: unknown }) : {};
    const ids = Array.isArray(payload.ids)
      ? payload.ids.filter((x): x is string => typeof x === "string")
      : undefined;

    const updated = await markAsRead(user.id, ids);
    return NextResponse.json({ updated });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[notifications.read] failed:", err);
    return NextResponse.json(
      { error: "标记已读失败" },
      { status: 500 }
    );
  }
}
