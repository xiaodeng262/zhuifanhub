"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Share2,
  ShieldAlert,
  Flag,
  X,
  Check,
} from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";

/*
 * 资源详情页右上角操作栏
 *
 * 组合了四个交互按钮（收藏 / 分享 / 失效反馈 / 举报）加上两个对话框
 * （失效反馈 & 举报表单）。从 server 父组件接收初始状态：
 * - initialCollected: SSR 时已判断过当前用户是否收藏
 * - 失效反馈 / 举报：打开对话框时才触发 API，避免 SSR 侧过多工作
 *
 * 未登录态：按钮不禁用，但点击会引导跳 /login?next=...
 */

type ReportReason = "ad" | "spam" | "duplicate" | "illegal" | "other";

const REPORT_REASONS: Array<{ key: ReportReason; label: string }> = [
  { key: "ad", label: "广告 / 引流" },
  { key: "spam", label: "灌水 / 低质" },
  { key: "duplicate", label: "重复贴" },
  { key: "illegal", label: "违规 / 侵权" },
  { key: "other", label: "其他" },
];

export function ResourceActions({
  resourceId,
  initialCollected,
}: {
  resourceId: string;
  initialCollected: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const [collected, setCollected] = useState(initialCollected);
  const [collectBusy, setCollectBusy] = useState(false);
  const [shareOk, setShareOk] = useState(false);

  // 对话框开关
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // 若未登录，统一跳去登录页并在回调 next 里带回当前详情
  function requireLogin() {
    router.push(`/login?next=/resource/${resourceId}`);
  }

  async function handleCollect() {
    if (!user) return requireLogin();
    if (collectBusy) return;
    const next = !collected;
    // 乐观更新：UI 立即翻转，失败时再回滚
    setCollected(next);
    setCollectBusy(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/collect`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("collect failed");
    } catch {
      setCollected(!next);
    } finally {
      setCollectBusy(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareOk(true);
      window.setTimeout(() => setShareOk(false), 1500);
    } catch {
      // 剪贴板 API 不可用时静默失败；MVP 可接受
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
      <button
        onClick={handleCollect}
        disabled={collectBusy}
        className="btn-outline !py-2 !px-4 text-sm disabled:opacity-60"
        aria-pressed={collected}
      >
        {collected ? (
          <BookmarkCheck className="h-4 w-4 fill-sakura-500 text-sakura-500" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {collected ? "已收藏" : "收藏"}
      </button>

      <button
        onClick={handleShare}
        className="btn-outline !py-2 !px-4 text-sm"
      >
        {shareOk ? (
          <Check className="h-4 w-4 text-mint-500" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {shareOk ? "已复制" : "分享"}
      </button>

      <button
        aria-label="失效反馈：链接打不开，管理员将处理"
        onClick={() => (user ? setFeedbackOpen(true) : requireLogin())}
        className="inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-vanilla-300 px-4 py-2 font-pop text-sm text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-vanilla-500"
      >
        <ShieldAlert className="h-4 w-4" />
        失效反馈
      </button>

      <button
        aria-label="举报：内容违规 / 引流 / 低质，管理员将审核"
        onClick={() => (user ? setReportOpen(true) : requireLogin())}
        className="inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-sakura-300 px-4 py-2 font-pop text-sm text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-sakura-500 hover:text-white"
      >
        <Flag className="h-4 w-4" />
        举报
      </button>

      {feedbackOpen && (
        <FeedbackDialog
          resourceId={resourceId}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
      {reportOpen && (
        <ReportDialog
          resourceId={resourceId}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

/*
 * 失效反馈对话框
 * 表单仅两项：失效的具体链接（可选）+ 备注（可选）
 * 提交时后端自动把此条写入 reports 表，kind=dead
 */
function FeedbackDialog({
  resourceId,
  onClose,
}: {
  resourceId: string;
  onClose: () => void;
}) {
  const [deadLink, setDeadLink] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${resourceId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadLink: deadLink.trim(), note: note.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "提交失败");
      setOk(true);
      window.setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogShell title="反馈链接失效" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="失效的具体链接（可选）">
          <input
            value={deadLink}
            onChange={(e) => setDeadLink(e.target.value)}
            placeholder="比如某个网盘的分享地址"
            className="field-input"
          />
        </Field>
        <Field label="补充说明（可选）">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="例如：提取码已失效 / 提示账号被封"
            className="field-input resize-none"
          />
        </Field>
        {error && (
          <p className="rounded-2xl bg-sakura-100 px-3 py-2 text-xs text-sakura-700">
            {error}
          </p>
        )}
        {ok && (
          <p className="rounded-2xl bg-mint-100 px-3 py-2 text-xs text-mint-500">
            已提交，感谢反馈！
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline !py-2 !px-4 text-xs"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || ok}
            className="btn-sakura !py-2 !px-4 text-xs disabled:opacity-60"
          >
            {submitting ? "提交中..." : "提交反馈"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

/*
 * 内容举报对话框
 * 必选一个 reason；备注选填
 */
function ReportDialog({
  resourceId,
  onClose,
}: {
  resourceId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("ad");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${resourceId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note: note.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "提交失败");
      setOk(true);
      window.setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogShell title="举报内容" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="请选择举报原因">
          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <button
                type="button"
                key={r.key}
                onClick={() => setReason(r.key)}
                className={`rounded-full border-[3px] border-plum-900 px-3 py-1 font-pop text-xs shadow-pop transition-all ${
                  reason === r.key
                    ? "bg-sakura-500 text-white"
                    : "bg-white text-plum-900 hover:bg-sakura-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="补充说明（可选）">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="可简述理由、发布者手法、对比资源等"
            className="field-input resize-none"
          />
        </Field>
        {error && (
          <p className="rounded-2xl bg-sakura-100 px-3 py-2 text-xs text-sakura-700">
            {error}
          </p>
        )}
        {ok && (
          <p className="rounded-2xl bg-mint-100 px-3 py-2 text-xs text-mint-500">
            已提交，管理员会尽快审核
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline !py-2 !px-4 text-xs"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || ok}
            className="btn-sakura !py-2 !px-4 text-xs disabled:opacity-60"
          >
            {submitting ? "提交中..." : "提交举报"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

/*
 * 对话框壳
 * - 固定全屏蒙层 + 居中卡片
 * - 点击背景关闭
 * - 不依赖第三方 modal 库，贴合本项目的卡通 Pop 视觉
 */
function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-blob border-[3px] border-plum-900 bg-milk-100 p-6 shadow-pop"
      >
        <button
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-plum-900 bg-white transition hover:bg-sakura-100"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-4 font-pop text-2xl text-plum-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-pop text-xs text-plum-900">{label}</span>
      {children}
    </label>
  );
}
