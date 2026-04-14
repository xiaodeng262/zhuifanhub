import { NextResponse } from "next/server";
import {
  createComment,
  findCommentById,
  listCommentsByResource,
} from "@/lib/store/comments";
import { findResourceById } from "@/lib/store/resources";
import { findByUsername } from "@/lib/auth/store";
import { requireUser } from "@/lib/auth/admin";
import {
  createNotification,
  createNotificationsBulk,
} from "@/lib/store/notifications";

/*
 * 评论列表与发布
 *
 * GET  /api/resources/[id]/comments   公开
 * POST /api/resources/[id]/comments   需登录，body { body: string, parentId?: string }
 *
 * 关键修正（相对 Step 6 的旧版）：
 * - 旧版 POST 只读 body.body，把前端发来的 parentId 完全丢掉，导致所有回复沦为一级评论
 * - 新版：读 parentId、校验父评论存在、属于同一资源、未被级联删除
 *
 * 通知副作用：
 * - 若是回复（parentId 存在）→ 给父评论作者发一条 "reply"
 * - 若评论正文里含 @用户名 → 给被提及者发 "mention"
 * - 通知写入失败不回滚评论（评论是主，通知是附加），只记日志
 */

export const runtime = "nodejs";

// @username 正则：支持中英文字母、数字、下划线；终止符是空白或非 word 字符
// 为什么不允许 "-": 避免和 URL 中的 "@" 混淆，MVP 保守策略
const MENTION_RE = /@([A-Za-z0-9_\u4e00-\u9fa5]{1,32})/g;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const items = await listCommentsByResource(id);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[comments.GET] failed:", err);
    return NextResponse.json(
      { error: "评论加载失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;

    // 验证资源存在，避免孤儿评论
    const resource = await findResourceById(id);
    if (!resource || resource.status === "removed") {
      return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    }

    const body = (await req.json()) as { body?: string; parentId?: string };
    const text = String(body.body ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "请输入评论内容" }, { status: 400 });
    }
    if (text.length > 500) {
      return NextResponse.json(
        { error: "评论不能超过 500 字" },
        { status: 400 }
      );
    }

    // 校验 parentId：必须存在、属于同资源、父评论未被删除
    // 不存在或跨资源都视为越权请求，统一 400
    let parentComment: Awaited<ReturnType<typeof findCommentById>> = undefined;
    const parentId = body.parentId?.trim();
    if (parentId) {
      parentComment = await findCommentById(parentId);
      if (!parentComment) {
        return NextResponse.json(
          { error: "被回复的评论不存在或已被删除" },
          { status: 400 }
        );
      }
      if (parentComment.resourceId !== id) {
        return NextResponse.json(
          { error: "被回复的评论不属于此资源" },
          { status: 400 }
        );
      }
    }

    const comment = await createComment({
      resourceId: id,
      authorId: user.id,
      authorName: user.username,
      body: text,
      parentId: parentComment?.id,
    });

    // ---- 通知副作用（失败不影响评论写入） ----

    // 1) 回复通知：父评论作者 ← 当前用户
    if (parentComment) {
      createNotification({
        userId: parentComment.authorId,
        actorId: user.id,
        actorName: user.username,
        type: "reply",
        resourceId: id,
        commentId: comment.id,
        body: text,
      }).catch((e) => console.error("[notify.reply] failed:", e));
    }

    // 2) @mention 通知：解析正文里的 @username 集合，去重后逐个查用户发通知
    //    - 若 @ 的就是当前评论的直接被回复人，则跳过（reply 通知已覆盖），避免重复提示
    const mentionedUsernames = Array.from(
      new Set(
        Array.from(text.matchAll(MENTION_RE)).map((m) =>
          m[1].toLowerCase()
        )
      )
    );
    if (mentionedUsernames.length > 0) {
      // 逐个查用户；用户名不存在直接忽略
      // 注：findByUsername 本身大小写不敏感，这里重复 lowercase 只是为了 Set 去重的确定性
      const lookups = await Promise.all(
        mentionedUsernames.map((name) => findByUsername(name))
      );
      const targets = lookups
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .filter((u) => u.id !== user.id) // 不给自己发
        .filter((u) => u.id !== parentComment?.authorId); // 去重：已在 reply 通知里

      if (targets.length > 0) {
        createNotificationsBulk(
          targets.map((u) => ({
            userId: u.id,
            actorId: user.id,
            actorName: user.username,
            type: "mention",
            resourceId: id,
            commentId: comment.id,
            body: text,
          }))
        ).catch((e) => console.error("[notify.mention] failed:", e));
      }
    }

    return NextResponse.json({ comment });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[comments.POST] failed:", err);
    return NextResponse.json(
      { error: "发布评论失败，请重试" },
      { status: 500 }
    );
  }
}
