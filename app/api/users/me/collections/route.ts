import { NextResponse } from "next/server";
import { listCollectionsByUser } from "@/lib/store/collections";
import { requireUser } from "@/lib/auth/admin";

/*
 * 当前用户的收藏列表
 *
 * GET /api/users/me/collections   需登录
 * 返回 { items: Resource[] }，已按收藏时间倒序、剔除软删除资源
 */

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await listCollectionsByUser(user.id);
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[users.me.collections.GET] failed:", err);
    return NextResponse.json(
      { error: "加载收藏失败" },
      { status: 500 }
    );
  }
}
