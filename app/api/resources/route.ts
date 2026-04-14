import { NextResponse } from "next/server";
import {
  createResource,
  listResources,
  type CreateResourceInput,
} from "@/lib/store/resources";
import { requireUser } from "@/lib/auth/admin";
import type { Category, PostKind } from "@/lib/types";

/*
 * 资源列表与发布
 *
 * GET  /api/resources?category=&q=&kind=&page=&pageSize=   公开
 * POST /api/resources                                      需登录
 *
 * GET 通过 query 参数组合筛选，分页字段全部可选。
 * POST 接收表单字段，存储类型由后端根据 URL 自动推断，
 *     前端只传 { label, url } 即可。
 */

export const runtime = "nodejs";

// 分类白名单，防止前端传入非法值
const VALID_CATEGORIES: readonly Category[] = [
  "new-anime",
  "classic",
  "movie",
  "artwork",
  "tool",
];

const VALID_KINDS: readonly PostKind[] = ["share", "seek"];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") as Category | null;
    const kind = url.searchParams.get("kind") as PostKind | null;
    const q = url.searchParams.get("q") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");

    const result = await listResources({
      category: category && VALID_CATEGORIES.includes(category) ? category : undefined,
      kind: kind && VALID_KINDS.includes(kind) ? kind : undefined,
      q,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize >= 0 ? pageSize : 20,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[resources.GET] failed:", err);
    return NextResponse.json(
      { error: "资源加载失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 鉴权：未登录直接抛 401
    const user = await requireUser();

    const body = (await req.json()) as Partial<{
      title: string;
      alias: string;
      cover: string;
      category: Category;
      kind: PostKind;
      tags: string[];
      description: string;
      links: Array<{ label: string; url: string }>;
      year: number;
      bounty: number;
    }>;

    // 必填字段校验
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const cover = String(body.cover ?? "").trim();
    const category = body.category as Category | undefined;
    const kind = body.kind as PostKind | undefined;

    if (!title) return bad("请填写资源标题");
    if (title.length > 80) return bad("标题不能超过 80 个字符");
    if (!description) return bad("请填写资源描述");
    if (description.length > 2000) return bad("描述不能超过 2000 个字符");
    if (!cover || !/^https?:\/\//i.test(cover)) {
      return bad("封面必须是 http/https 开头的图片地址");
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return bad("请选择有效的分类");
    }
    if (!kind || !VALID_KINDS.includes(kind)) {
      return bad("请选择资源类型");
    }

    // 标签去重 + 限制数量
    const tags = Array.isArray(body.tags)
      ? Array.from(
          new Set(
            body.tags
              .map((t) => String(t ?? "").trim())
              .filter((t) => t.length > 0 && t.length <= 20)
          )
        ).slice(0, 8)
      : [];

    // 链接字段校验：分享贴至少一条有效链接，求助贴可为空
    const rawLinks = Array.isArray(body.links) ? body.links : [];
    const links = rawLinks
      .map((l) => ({
        label: String(l?.label ?? "").trim(),
        url: String(l?.url ?? "").trim(),
      }))
      .filter((l) => l.label && l.url);

    if (kind === "share" && links.length === 0) {
      return bad("分享贴至少需要一条有效链接");
    }

    const input: CreateResourceInput = {
      title,
      alias: body.alias ? String(body.alias).trim() || undefined : undefined,
      cover,
      category,
      kind,
      tags,
      description,
      links,
      year: typeof body.year === "number" && body.year > 0 ? body.year : undefined,
      bounty:
        kind === "seek" && typeof body.bounty === "number" && body.bounty > 0
          ? body.bounty
          : undefined,
      authorId: user.id,
      authorName: user.username,
    };

    const resource = await createResource(input);
    return NextResponse.json({ resource });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[resources.POST] failed:", err);
    return NextResponse.json(
      { error: "发布失败，请稍后重试" },
      { status: 500 }
    );
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
