"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AtSign, Reply, X } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import type { Comment } from "@/lib/types";

/*
 * 评论区（客户端组件）
 *
 * 数据来源：mount 后 fetch /api/resources/[id]/comments
 * 登录态：useAuth()
 * - 已登录：渲染输入框，提交后乐观追加到列表
 * - 未登录：渲染「登录后参与讨论」引导卡
 *
 * 嵌套支持：
 * - 一级评论：parentId 为空，作为主时间线
 * - 二级回复：parentId 指向父评论，渲染在父评论之下
 * - MVP 只支持两层（回复一级评论）；即使后端接受多层 parentId，
 *   UI 也会把深层回复平铺到一级下的回复区，避免无限缩进
 * - 回复表单通过 replyingTo state 切换：点"回复"→在该条评论下展开输入框
 *
 * 不从 server 端拉取评论的原因：
 * - 详情页高频访问，评论是动态内容，SSR 会污染缓存
 * - 客户端拉取的额外延迟对阅读体验无感（卡片已经渲染完）
 */

const AVATAR_COLORS = [
  "bg-sakura-300",
  "bg-sky2-200",
  "bg-vanilla-300",
  "bg-mint-300",
  "bg-lavender-300",
];

export function CommentSection({ resourceId }: { resourceId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [topBody, setTopBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    async function load() {
      try {
        const res = await fetch(`/api/resources/${resourceId}/comments`);
        const data = (await res.json()) as { items?: Comment[] };
        if (!aborted) setComments(data.items ?? []);
      } catch {
        // 静默失败：空列表即可，不阻塞其它内容
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, [resourceId]);

  /*
   * 把扁平评论列表按 parentId 聚合成两级结构
   * - 一级：parentId 为空的评论，按时间升序排
   * - 二级：按 parentId 分组，挂在对应一级评论下（MVP 不嵌套更深）
   * - 若 parentId 指向不存在的评论（数据异常），归为一级显示，避免丢失
   */
  const { topLevel, repliesByParent } = useMemo(() => {
    const byId = new Map(comments.map((c) => [c.id, c]));
    const tops: Comment[] = [];
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parentId || !byId.has(c.parentId)) {
        tops.push(c);
      } else {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    tops.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const list of map.values()) {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return { topLevel: tops, repliesByParent: map };
  }, [comments]);

  async function submitTop() {
    const trimmed = topBody.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = (await res.json()) as {
        comment?: Comment;
        error?: string;
      };
      if (!res.ok || !data.comment) {
        throw new Error(data.error || "发布失败");
      }
      setComments((prev) => [...prev, data.comment!]);
      setTopBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * 提交回复
   * 独立函数而不是复用 submitTop：回复表单有自己的输入 state（local），
   * 成功后只清空那个子表单，不影响顶部的 topBody
   */
  async function submitReply(parentId: string, body: string): Promise<boolean> {
    const trimmed = body.trim();
    if (!trimmed) return false;
    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, parentId }),
      });
      const data = (await res.json()) as {
        comment?: Comment;
        error?: string;
      };
      if (!res.ok || !data.comment) {
        throw new Error(data.error || "回复失败");
      }
      setComments((prev) => [...prev, data.comment!]);
      setReplyingTo(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "回复失败");
      return false;
    }
  }

  return (
    <section>
      <h2 className="marker mb-5">评论 · {comments.length} 条</h2>

      {/* 顶部输入区：仅登录用户可见 */}
      {user ? (
        <div className="bubble p-5">
          <textarea
            rows={3}
            value={topBody}
            onChange={(e) => setTopBody(e.target.value)}
            placeholder="留下你的想法… 输入 @ 可以提到某位用户 🌸"
            className="w-full resize-none bg-transparent font-display text-sm text-plum-900 placeholder:text-plum-500/50 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-plum-900/15 pt-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-plum-500">
              <AtSign className="h-3 w-3" />
              {error ?? "支持 @ 提醒"}
            </span>
            <button
              onClick={submitTop}
              disabled={submitting || !topBody.trim()}
              className="btn-sakura !px-4 !py-2 text-xs disabled:opacity-60"
            >
              {submitting ? "发布中..." : "发布评论"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bubble flex items-center justify-between gap-4 p-5">
          <p className="font-display text-sm text-plum-700">
            登录后即可参与讨论 ✨
          </p>
          <Link
            href={`/login?next=/resource/${resourceId}`}
            className="btn-sakura !px-4 !py-2 text-xs"
          >
            去登录
          </Link>
        </div>
      )}

      {/* 评论列表 */}
      <ul className="mt-6 flex flex-col gap-5">
        {loading ? (
          <li className="bubble p-5 font-display text-xs text-plum-500">
            加载中...
          </li>
        ) : topLevel.length === 0 ? (
          <li className="bubble p-5 text-center font-display text-xs text-plum-500">
            还没有评论，来抢沙发 🛋
          </li>
        ) : (
          topLevel.map((c, i) => (
            <CommentItem
              key={c.id}
              comment={c}
              colorIndex={i}
              replies={repliesByParent.get(c.id) ?? []}
              loggedIn={!!user}
              isReplying={replyingTo === c.id}
              onStartReply={() => setReplyingTo(c.id)}
              onCancelReply={() => setReplyingTo(null)}
              onSubmitReply={(body) => submitReply(c.id, body)}
              resourceId={resourceId}
            />
          ))
        )}
      </ul>
    </section>
  );
}

/*
 * 单条评论（含其下所有回复）
 * 把每条评论 + 其回复列表作为一个"块"渲染，便于 state 局部化
 */
function CommentItem({
  comment,
  colorIndex,
  replies,
  loggedIn,
  isReplying,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  resourceId,
}: {
  comment: Comment;
  colorIndex: number;
  replies: Comment[];
  loggedIn: boolean;
  isReplying: boolean;
  onStartReply: () => void;
  onCancelReply: () => void;
  onSubmitReply: (body: string) => Promise<boolean>;
  resourceId: string;
}) {
  return (
    <li
      id={`comment-${comment.id}`}
      className="flex flex-col gap-4 bubble p-5 scroll-mt-24"
    >
      <div className="flex gap-4">
        <Avatar name={comment.authorName} index={colorIndex} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-pop text-base text-plum-900">
              {comment.authorName}
            </span>
            <span className="font-mono text-[10px] text-plum-500">
              {formatTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap font-display text-sm leading-relaxed text-plum-700">
            {comment.body}
          </p>

          {/* 回复按钮：登录用户可见 */}
          {loggedIn && !isReplying && (
            <button
              onClick={onStartReply}
              className="mt-2 inline-flex items-center gap-1 font-pop text-[11px] text-plum-500 hover:text-sakura-600"
            >
              <Reply className="h-3 w-3" />
              回复
            </button>
          )}
          {!loggedIn && (
            <Link
              href={`/login?next=/resource/${resourceId}`}
              className="mt-2 inline-flex items-center gap-1 font-pop text-[11px] text-plum-500 hover:text-sakura-600"
            >
              <Reply className="h-3 w-3" />
              登录后回复
            </Link>
          )}
        </div>
      </div>

      {/* 回复输入框（只有点开某条评论的"回复"才出现） */}
      {isReplying && (
        <ReplyForm
          replyingTo={comment.authorName}
          onCancel={onCancelReply}
          onSubmit={onSubmitReply}
        />
      )}

      {/* 回复列表：嵌套渲染，仅两级 */}
      {replies.length > 0 && (
        <ul className="ml-12 flex flex-col gap-4 border-l-2 border-dashed border-plum-900/15 pl-5">
          {replies.map((r, j) => (
            <li
              key={r.id}
              id={`comment-${r.id}`}
              className="flex gap-3 scroll-mt-24"
            >
              <Avatar name={r.authorName} index={colorIndex + j + 1} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-pop text-sm text-plum-900">
                    {r.authorName}
                  </span>
                  <span className="font-mono text-[10px] text-plum-500">
                    {formatTime(r.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap font-display text-sm leading-relaxed text-plum-700">
                  <span className="mr-1 text-sakura-600">
                    @{comment.authorName}
                  </span>
                  {r.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/*
 * 回复输入子表单
 * 独立组件以便每条评论维护自己的 body state，避免跨条污染
 */
function ReplyForm({
  replyingTo,
  onCancel,
  onSubmit,
}: {
  replyingTo: string;
  onCancel: () => void;
  onSubmit: (body: string) => Promise<boolean>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (busy || !body.trim()) return;
    setBusy(true);
    const ok = await onSubmit(body);
    setBusy(false);
    if (ok) setBody("");
  }

  return (
    <div className="ml-12 rounded-2xl border-2 border-dashed border-plum-900/20 bg-milk-100 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-pop text-[11px] text-plum-500">
          回复 @{replyingTo}
        </span>
        <button
          onClick={onCancel}
          aria-label="取消回复"
          className="ml-auto text-plum-500 hover:text-sakura-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="写点什么…"
        autoFocus
        className="w-full resize-none bg-transparent font-display text-sm text-plum-900 placeholder:text-plum-500/50 focus:outline-none"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={busy || !body.trim()}
          className="btn-sakura !px-3 !py-1.5 text-[11px] disabled:opacity-60"
        >
          {busy ? "发送中..." : "发送回复"}
        </button>
      </div>
    </div>
  );
}

function Avatar({
  name,
  index,
  size = "md",
}: {
  name: string;
  index: number;
  size?: "sm" | "md";
}) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const dim = size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-lg";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl border-[3px] border-plum-900 ${color} font-pop text-plum-900 ${dim}`}
    >
      {name[0] ?? "?"}
    </div>
  );
}

// 简易相对时间：为避免引入 dayjs 等库，MVP 手写
function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "刚刚";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return iso.slice(0, 10);
}
