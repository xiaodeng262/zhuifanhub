import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/*
 * Session 管理
 * 方案：HMAC 签名的 cookie，载荷是 { userId, iat }
 * 不用 JWT 库，避免引入额外依赖；对 MVP 足够安全
 *
 * 为什么不用 iron-session / next-auth：
 * - 单账号密码登录场景简单，自建更透明
 * - 后续要加 OAuth / 多设备登出时，再切库也很便宜
 */

/*
 * 签名密钥：必须由 AUTH_SECRET 环境变量注入
 * 设计意图：
 * - 生产环境缺失 AUTH_SECRET 时直接启动失败，避免默认弱密钥被沿用
 * - 开发环境（NODE_ENV !== "production"）才允许回退到已知的开发密钥，
 *   并在控制台显式告警，提醒开发者补齐 .env.local
 * - 这里用模块顶层 throw 是刻意的：只要代码被 import 就会触发检查，
 *   任何 runtime 代码路径都无法绕过
 */
const SECRET: string = (() => {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not set (or shorter than 16 chars). Set a strong random value in the production environment before starting the server."
    );
  }
  // 开发态告警但不阻断：允许 npm run dev 无需配置立即跑起来
  if (!fromEnv) {
    console.warn(
      "[auth] AUTH_SECRET not set — falling back to insecure dev secret. Set AUTH_SECRET in .env.local before deploying."
    );
  }
  return "zhuifan-dev-secret-DO-NOT-USE-IN-PRODUCTION";
})();

const COOKIE_NAME = "zhuifan_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 天

interface SessionPayload {
  userId: string;
  iat: number; // issued-at，毫秒
}

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

// cookie 值格式：base64url(payload).hex(signature)
export function encodeSession(userId: string): string {
  const payload: SessionPayload = { userId, iat: Date.now() };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string): SessionPayload | null {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return null;

  // 恒定时间比对签名
  const expected = sign(body);
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf-8")
    ) as SessionPayload;
    // 过期校验：与 cookie maxAge 一致
    if (Date.now() - payload.iat > MAX_AGE_SEC * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// 写入 session cookie
export async function setSessionCookie(userId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, encodeSession(userId), {
    httpOnly: true, // 防 XSS 读取
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // 允许导航携带，阻挡跨站 POST
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

// 从 cookie 中恢复当前用户 id（未登录返回 null）
export async function getSessionUserId(): Promise<string | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token)?.userId ?? null;
}
