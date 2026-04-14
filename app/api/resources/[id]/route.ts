import { NextResponse } from "next/server";
import {
  findResourceById,
  incrementResourceStat,
  softRemoveResource,
} from "@/lib/store/resources";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminUser, requireUser } from "@/lib/auth/admin";
import { isCollected } from "@/lib/store/collections";
import { isFollowing } from "@/lib/store/follows";

/*
 * 单个资源
 *
 * GET    /api/resources/[id]   公开。附带 isCollected / isFollowingAuthor
 *                              方便客户端子组件拿到初始状态，不用再发一次请求。
 *                              副作用：views + 1（MVP 接受不精确）
 * DELETE /api/resources/[id]   需登录 + (作者本人 ‖ 管理员)。软删除。
 */

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const resource = await findResourceById(id);
    if (!resource || resource.status === "removed") {
      return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    }

    // 获取当前用户的个性化状态
    const user = await getCurrentUser();
    const collected = user ? await isCollected(user.id, id) : false;
    const followingAuthor = user
      ? await isFollowing(user.id, resource.authorId)
      : false;

    // fire-and-forget 的 views+1；失败不影响主响应
    incrementResourceStat(id, "views", 1).catch(() => {});

    return NextResponse.json({
      resource,
      isCollected: collected,
      isFollowingAuthor: followingAuthor,
    });
  } catch (err) {
    console.error("[resources.GET:id] failed:", err);
    return NextResponse.json(
      { error: "资源加载失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const resource = await findResourceById(id);
    if (!resource) {
      return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    }

    // 只有作者或管理员能删
    const canDelete = resource.authorId === user.id || isAdminUser(user);
    if (!canDelete) {
      return NextResponse.json({ error: "无权限删除" }, { status: 403 });
    }

    await softRemoveResource(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[resources.DELETE:id] failed:", err);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}
