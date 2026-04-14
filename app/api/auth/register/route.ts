import { NextResponse } from "next/server";
import {
  findByUsername,
  createUser,
  existsByRegisterIp,
} from "@/lib/auth/store";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { getClientIp } from "@/lib/auth/client-ip";

/*
 * 注册接口
 * - 校验账号格式：2-16 位字母/数字/下划线/中文
 * - 校验密码长度：≥6 位
 * - 用户名已存在返回 409
 * - 反滥用：同一客户端 IP 已注册过用户时拒绝（无邮箱/短信验证的兜底措施）
 * - 成功后立即写入 session cookie，客户端无需再登录一次
 */

// 强制 Node runtime（需要 fs / scrypt）
export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,16}$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: unknown;
      password?: unknown;
    };
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "账号需为 2-16 位字母、数字、下划线或中文" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要 6 位" },
        { status: 400 }
      );
    }

    const existing = await findByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "该账号已被注册" }, { status: 409 });
    }

    /*
     * 同 IP 反滥用校验
     * - 解析不到 IP 时 getClientIp 返回 null，existsByRegisterIp 会直接放行
     *   （不应让本地脚本/反代异常情况下的合法用户被误伤）
     * - 命中已存在的注册 IP 直接 429，传递"请求被节流"的语义
     */
    const ip = getClientIp(req);
    if (await existsByRegisterIp(ip)) {
      return NextResponse.json(
        { error: "当前网络已注册过账号，如需更多账号请联系管理员" },
        { status: 429 }
      );
    }

    const user = await createUser(username, hashPassword(password), ip);
    await setSessionCookie(user.id);

    return NextResponse.json({
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("[register] failed:", err);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
