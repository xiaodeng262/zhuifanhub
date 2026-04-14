import { NextResponse } from "next/server";
import { collect, uncollect } from "@/lib/store/collections";
import { findResourceById } from "@/lib/store/resources";
import { requireUser } from "@/lib/auth/admin";

/*
 * 收藏与取消收藏
 *
 * POST   /api/resources/[id]/collect   需登录
 * DELETE /api/resources/[id]/collect   需登录
 *
 * 两个动词语义清晰，避免用 body.action 区分。
 * store 函数已保证幂等，无需在路由层去重。
 */

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const resource = await findResourceById(id);
    if (!resource || resource.status === "removed") {
      return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    }
    await collect(user.id, id);
    return NextResponse.json({ collected: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[collect.POST] failed:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    await uncollect(user.id, id);
    return NextResponse.json({ collected: false });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[collect.DELETE] failed:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
