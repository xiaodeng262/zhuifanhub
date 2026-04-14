import { NextResponse } from "next/server";
import { updateUserRole, type UserRole } from "@/lib/auth/store";
import { requireAdmin } from "@/lib/auth/admin";

/*
 * 修改用户角色
 *
 * PATCH /api/admin/users/[id]/role   仅管理员
 *   body: { role: "user" | "admin" }
 *
 * 业务规则：
 * - 管理员不能把自己降级为 user（防止误操作导致无人可用）
 * - 角色只有两种；未来扩展 "mod" 等时在 VALID_ROLES 加一个值即可
 */

export const runtime = "nodejs";

const VALID_ROLES: readonly UserRole[] = ["user", "admin"];

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const body = (await req.json()) as { role?: UserRole };
    const role = body.role;
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "请提供有效的角色" },
        { status: 400 }
      );
    }

    // 不允许管理员把自己降级为 user
    if (id === admin.id && role !== "admin") {
      return NextResponse.json(
        { error: "不能移除自己的管理员身份" },
        { status: 400 }
      );
    }

    const updated = await updateUserRole(id, role);
    if (!updated) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        username: updated.username,
        createdAt: updated.createdAt,
        role: updated.role ?? "user",
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin.users.role.PATCH] failed:", err);
    return NextResponse.json(
      { error: "更新角色失败" },
      { status: 500 }
    );
  }
}
