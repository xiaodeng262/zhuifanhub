import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

/*
 * 登出接口
 * 仅清除 session cookie；服务端无 session 表需要清理
 */

export const runtime = "nodejs";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
