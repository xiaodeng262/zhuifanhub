import { NextResponse } from "next/server";
import { listResources } from "@/lib/store/resources";
import { requireUser } from "@/lib/auth/admin";

/*
 * 当前用户发布的资源
 *
 * GET /api/users/me/resources   需登录
 * 返回 { items, total, page, pageSize }
 *
 * 复用 listResources({ authorId }) 过滤器；authorId 由 session 推导
 * 避免前端传自己的 id 造成信息泄露
 */

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const result = await listResources({
      authorId: user.id,
      pageSize: 0, // 全部返回，我的发布量不会很大
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[users.me.resources.GET] failed:", err);
    return NextResponse.json(
      { error: "加载我的发布失败" },
      { status: 500 }
    );
  }
}
