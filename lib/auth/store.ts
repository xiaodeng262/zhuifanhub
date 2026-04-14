import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { User as UserRow } from "@prisma/client";

/*
 * 用户存储层（Prisma 版）
 *
 * 对外仍导出旧的 User interface 形状，避免 API / 组件改动：
 * - createdAt 以 ISO 字符串导出，与旧 JSON store 行为一致
 * - role 在数据库端是 String 列，映射为 "user" | "admin" 联合类型
 * - passwordHash 原样透传
 *
 * 首次注册自动 admin 的逻辑保留：新部署没有任何真实用户时，
 * 第一个注册者变成管理员，避免"谁都进不了后台"的死锁。
 * 注意：seed 占位用户 id="seed" 不算真实用户，counting 时排除它。
 */

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  role?: UserRole;
  // 注册时记录的客户端 IP；老数据可能为 null
  registerIp?: string | null;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
    role: (row.role as UserRole) ?? "user",
    registerIp: row.registerIp ?? null,
  };
}

/*
 * 按账号名查找（大小写不敏感）
 * Prisma 用 mode: "insensitive"，免去业务层 lowercase 对齐
 */
export async function findByUsername(
  username: string
): Promise<User | undefined> {
  const row = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  return row ? rowToUser(row) : undefined;
}

export async function findById(id: string): Promise<User | undefined> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? rowToUser(row) : undefined;
}

/*
 * 创建用户：调用方已做密码哈希
 * - 首个真实用户（忽略 id="seed" 占位）自动成为 admin
 * - registerIp 由调用方从请求头解析后传入；解析不到时传 null，仅记录而不限流
 */
export async function createUser(
  username: string,
  passwordHash: string,
  registerIp: string | null
): Promise<User> {
  const realCount = await prisma.user.count({
    where: { NOT: { id: "seed" } },
  });
  const isFirst = realCount === 0;
  const row = await prisma.user.create({
    data: {
      id: randomUUID(),
      username,
      passwordHash,
      role: isFirst ? "admin" : "user",
      registerIp,
    },
  });
  return rowToUser(row);
}

/*
 * 是否存在以指定 IP 注册过的真实用户
 * - 反滥用前置校验：同一 IP 不允许注册多个账号
 * - 排除 seed 占位用户：它的 registerIp 恒为 null，不会命中，但显式排除让意图更清晰
 * - ip 为 null/空时直接放行：解析不到客户端地址不应阻塞合法用户
 */
export async function existsByRegisterIp(
  ip: string | null
): Promise<boolean> {
  if (!ip) return false;
  const hit = await prisma.user.findFirst({
    where: {
      registerIp: ip,
      NOT: { id: "seed" },
    },
    select: { id: true },
  });
  return !!hit;
}

/*
 * 更新用户角色（管理员后台使用）
 */
export async function updateUserRole(
  id: string,
  role: UserRole
): Promise<User | undefined> {
  try {
    const row = await prisma.user.update({
      where: { id },
      data: { role },
    });
    return rowToUser(row);
  } catch {
    return undefined;
  }
}

/*
 * 列出全部真实用户（管理员后台使用）
 * 按创建时间倒序；排除 seed 占位用户
 * 调用方需剔除 passwordHash 再下发
 */
export async function listUsers(): Promise<User[]> {
  const rows = await prisma.user.findMany({
    where: { NOT: { id: "seed" } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToUser);
}
