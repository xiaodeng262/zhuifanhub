import { NextResponse } from "next/server";
import { follow, unfollow } from "@/lib/store/follows";
import { findById } from "@/lib/auth/store";
import { requireUser } from "@/lib/auth/admin";

/*
 * 关注 / 取消关注用户
 *
 * POST   /api/users/[id]/follow   需登录
 * DELETE /api/users/[id]/follow   需登录
 *
 * 业务规则：
 * - 不允许关注自己
 * - 不允许关注种子数据的伪造作者 "seed"
 * - 被关注的用户必须真实存在
 */

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: followeeId } = await ctx.params;

    if (followeeId === "seed") {
      return NextResponse.json(
        { error: "无法关注系统种子用户" },
        { status: 400 }
      );
    }
    if (followeeId === user.id) {
      return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
    }

    const target = await findById(followeeId);
    if (!target) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    await follow(user.id, followeeId);
    return NextResponse.json({ following: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[follow.POST] failed:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: followeeId } = await ctx.params;
    await unfollow(user.id, followeeId);
    return NextResponse.json({ following: false });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[follow.DELETE] failed:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
