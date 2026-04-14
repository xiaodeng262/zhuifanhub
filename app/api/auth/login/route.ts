import { NextResponse } from "next/server";
import { findByUsername } from "@/lib/auth/store";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

/*
 * 登录接口
 * - 无论是账号不存在还是密码错误，都返回同一条消息，避免泄露账号是否存在
 * - 成功后签发新 session（即使已有旧 session）
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: unknown;
      password?: unknown;
    };
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "账号和密码不能为空" },
        { status: 400 }
      );
    }

    const user = await findByUsername(username);
    // 统一错误文案：避免通过响应差异枚举已注册账号
    const genericError = NextResponse.json(
      { error: "账号或密码错误" },
      { status: 401 }
    );
    if (!user) return genericError;
    if (!verifyPassword(password, user.passwordHash)) return genericError;

    await setSessionCookie(user.id);

    return NextResponse.json({
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("[login] failed:", err);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
