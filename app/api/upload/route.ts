import { NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/storage/s3";
import { requireUser } from "@/lib/auth/admin";

/*
 * 通用文件上传
 *
 * POST /api/upload   需登录
 *   Content-Type: multipart/form-data
 *   field "file":    二进制文件
 *   field "prefix":  可选，对象 key 前缀（默认 covers）
 *
 * 响应: { url, key }
 *
 * 校验：
 * - 仅接收图片：image/(jpeg|png|webp|gif|avif)
 * - 大小上限 5 MB（超过返回 413）
 * - 未登录 401
 * - 对象存储未配置 503（开发期便于发现缺失 env）
 */

export const runtime = "nodejs";

// 5 MB 上限：封面图足够，不给滥用空间
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set<string>([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// prefix 白名单：防止前端乱传路径造成存储桶结构混乱
const ALLOWED_PREFIXES = new Set<string>(["covers", "avatars"]);

export async function POST(req: Request) {
  try {
    await requireUser();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "请上传一个文件" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPG / PNG / WebP / GIF / AVIF 格式" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "文件大小不能超过 5 MB" },
        { status: 413 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    const rawPrefix = String(form.get("prefix") ?? "covers");
    const prefix = ALLOWED_PREFIXES.has(rawPrefix) ? rawPrefix : "covers";

    // 读入 Buffer 后交给 store 层处理
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url, key } = await uploadBuffer({
      buffer,
      contentType: file.type,
      originalName: file.name,
      prefix,
    });

    return NextResponse.json({ url, key });
  } catch (err) {
    if (err instanceof Response) return err;
    // 对象存储未配置的错误单独处理，给出 503 + 可读提示
    if (err instanceof Error && err.message.startsWith("对象存储未配置")) {
      console.error("[upload] storage not configured:", err.message);
      return NextResponse.json(
        { error: err.message },
        { status: 503 }
      );
    }
    console.error("[upload] failed:", err);
    return NextResponse.json(
      { error: "上传失败，请稍后重试" },
      { status: 500 }
    );
  }
}
