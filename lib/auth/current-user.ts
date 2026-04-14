import { findById, type User, type UserRole } from "./store";
import { getSessionUserId } from "./session";

/*
 * 把 cookie → user 的过程收敛到一个方法
 * 返回的对象已剔除 passwordHash 等敏感字段
 *
 * role 在返回时总是有值：存量用户如 role 字段缺失，默认当作 "user"
 * 这样下游代码不用到处写 `user.role ?? "user"`
 */

export type PublicUser = Pick<User, "id" | "username" | "createdAt"> & {
  role: UserRole;
};

export async function getCurrentUser(): Promise<PublicUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await findById(userId);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    role: user.role ?? "user",
  };
}
