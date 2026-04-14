import { NextResponse } from "next/server";
import { listNotices } from "@/lib/store/notices";

/*
 * 公告列表
 *
 * GET /api/notices   公开
 * 纯读接口，没有分页；公告总量本身很少，整页返回足够
 */

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listNotices();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[notices.GET] failed:", err);
    return NextResponse.json(
      { error: "公告加载失败" },
      { status: 500 }
    );
  }
}
