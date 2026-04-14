import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/admin";
import {
  countUnread,
  listNotificationsByUser,
} from "@/lib/store/notifications";

/*
 * GET /api/notifications
 *
 * 当前登录用户的通知列表 + 未读数
 * 查询参数：
 *   - limit      返回条数上限，默认 20
 *   - unreadOnly 传 "1" 时仅返回未读
 *
 * 返回：{ items, unreadCount }
 * Header 铃铛每次打开下拉时调用一次即可，MVP 不做增量推送
 */

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20)
    );
    const unreadOnly = url.searchParams.get("unreadOnly") === "1";

    const [items, unreadCount] = await Promise.all([
      listNotificationsByUser(user.id, { limit, onlyUnread: unreadOnly }),
      countUnread(user.id),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[notifications.GET] failed:", err);
    return NextResponse.json(
      { error: "通知加载失败" },
      { status: 500 }
    );
  }
}
