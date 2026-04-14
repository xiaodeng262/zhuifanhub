import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

/*
 * 当前用户查询接口
 * 客户端 Header / 个人中心等地方在首次渲染后轮询一次此接口
 * 未登录时 user=null，不返回 401，以便前端统一处理
 */

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  // 防止中间 CDN / 浏览器缓存把某个用户的 me 存下来
  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } }
  );
}
