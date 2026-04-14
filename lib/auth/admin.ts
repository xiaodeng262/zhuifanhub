import { NextResponse } from "next/server";
import { getCurrentUser, type PublicUser } from "./current-user";

/*
 * 管理员识别与鉴权辅助
 *
 * 管理员识别方案：环境变量 `ADMIN_USERNAMES=alice,bob`
 *
 * 为什么不加 role 字段到 User：
 * - 用户表是 append-only JSON，改字段需要遍历重写整个文件
 * - MVP 阶段管理员极少，用户名白名单足够
 * - 生产切换到真实数据库后可以无痛改为 role 字段
 *
 * requireUser / requireAdmin 语义：
 * - 通过 → 返回 PublicUser（调用方拿到登录态信息）
 * - 失败 → 抛出 NextResponse 作为控制流，API route 用 try/catch 捕获
 *   这样 route 主干逻辑不会被 if-return 噪音打断
 */

// 解析一次，避免每次请求都 split 字符串
const ADMIN_SET: ReadonlySet<string> = new Set(
  (process.env.ADMIN_USERNAMES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

/*
 * 判断指定用户是否为管理员
 *
 * 双重识别：
 * 1. role === "admin"（数据库字段，权威来源）
 * 2. 用户名在 ADMIN_USERNAMES 环境变量白名单里（bootstrap 兜底）
 *
 * 任一成立即视为管理员。这样：
 * - 老部署只配 env 仍然可用
 * - 新部署可以完全靠 role 字段管理，env 留空
 * - 过渡期两者可并存
 */
export function isAdminUser(user: PublicUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return ADMIN_SET.has(user.username.toLowerCase());
}

/*
 * 要求登录：未登录时抛出 401 Response
 * 典型用法：
 *   try { const user = await requireUser(); ... }
 *   catch (err) { if (err instanceof Response) return err; ... }
 */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  return user;
}

/*
 * 要求管理员：未登录 401，非管理员 403
 * 两种错误分开，方便前端区分"去登录"和"无权限"提示
 */
export async function requireAdmin(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    throw NextResponse.json({ error: "仅管理员可操作" }, { status: 403 });
  }
  return user;
}
