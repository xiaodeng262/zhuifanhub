import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/*
 * 密码哈希工具
 * 使用 Node 内置 scrypt（KDF 标准算法，抗 GPU 暴力破解）
 * 存储格式：salt:hash 一体，方便单列存储
 */

const KEY_LEN = 64;
const SALT_LEN = 16;

// 生成带盐哈希；相同密码每次结果不同（因盐随机）
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const derived = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${derived}`;
}

// 恒定时间比对，防止时序攻击
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LEN);
  // 长度不同 timingSafeEqual 会抛，先判断
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
