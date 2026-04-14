import { NextResponse } from "next/server";
import { listUsers } from "@/lib/auth/store";
import { requireAdmin } from "@/lib/auth/admin";

/*
 * 用户列表（管理员后台）
 *
 * GET /api/admin/users   仅管理员
 *
 * 返回 { users }，已剔除 passwordHash
 * 按创建时间倒序，便于找最新注册的用户
 */

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const all = await listUsers();
    // 剔除敏感字段：绝不返回 passwordHash
    const users = all.map((u) => ({
      id: u.id,
      username: u.username,
      createdAt: u.createdAt,
      role: u.role ?? "user",
    }));
    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin.users.GET] failed:", err);
    return NextResponse.json(
      { error: "加载用户列表失败" },
      { status: 500 }
    );
  }
}
