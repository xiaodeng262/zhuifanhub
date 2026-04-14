"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Link2,
  Send,
  CheckCircle2,
  Info,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";
import { useAuth } from "@/app/components/AuthProvider";

/*
 * 失效反馈页 /feedback
 *
 * 接入后端后逻辑：
 * 1. 从 resourceUrl 正则提取资源 id（/resource/<id>）
 * 2. 未登录 → 提示跳登录；已登录 → POST /api/resources/[id]/feedback
 * 3. 所有反馈都写入 reports 表，kind=dead，与详情页「失效反馈」复用
 *
 * 为什么不做 /api/feedback 独立路由：
 * - 失效反馈与详情页的「失效反馈」按钮共享同一后端，避免重复逻辑
 * - reason / note / deadLink 字段结构完全一致
 */

// 失效原因枚举：覆盖常见场景即可，留「其他」做兜底
// 目前 API 仅支持 note 字段承载类型信息，所以本地把 reason 拼到 note 前
type Reason = "dead" | "wrong" | "password" | "slow" | "other";
const REASONS: { key: Reason; label: string; desc: string }[] = [
  { key: "dead", label: "链接失效", desc: "404 / 文件已删除 / 账号被封" },
  { key: "wrong", label: "资源错误", desc: "内容与标题描述不符" },
  { key: "password", label: "密码错误", desc: "提取码或解压密码不对" },
  { key: "slow", label: "限速严重", desc: "几乎无法下载" },
  { key: "other", label: "其他问题", desc: "请在备注里详细说明" },
];

const REASON_LABEL: Record<Reason, string> = {
  dead: "链接失效",
  wrong: "资源错误",
  password: "密码错误",
  slow: "限速严重",
  other: "其他问题",
};

export default function FeedbackPage() {
  const { user } = useAuth();
  const [resourceUrl, setResourceUrl] = useState("");
  const [deadLink, setDeadLink] = useState("");
  const [reason, setReason] = useState<Reason>("dead");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 简单前端校验：至少要有一个可识别的链接
  const canSubmit =
    (resourceUrl.trim().length > 0 || deadLink.trim().length > 0) && !submitting;

  // 从站内资源 URL 中提取 id，匹配 /resource/<id>
  function extractResourceId(url: string): string | null {
    const match = url.match(/\/resource\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    // 必须是站内资源页地址
    const id = extractResourceId(resourceUrl.trim());
    if (!id) {
      setError("请填入站内资源详情页地址（形如 /resource/xxx）");
      return;
    }

    // 未登录则提示去登录
    if (!user) {
      setError("提交反馈前请先登录");
      return;
    }

    // 拼装 note：把 reason label、备注、联系方式合并到一条文本
    // 后端 reports 表只有 note 字段承载详细信息
    const noteParts = [
      `[问题] ${REASON_LABEL[reason]}`,
      note.trim() && `[说明] ${note.trim()}`,
      contact.trim() && `[联系] ${contact.trim()}`,
    ].filter(Boolean);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/resources/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadLink: deadLink.trim(),
          note: noteParts.join("\n"),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "提交失败");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络异常，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      {/* 顶部标题 */}
      <div className="mb-10">
        <p className="marker mb-3">Broken Link · 失效反馈</p>
        <h1 className="flex flex-wrap items-baseline gap-3 font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          失效反馈
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-plum-900 bg-vanilla-300 px-3 py-1 text-sm shadow-pop">
            <AlertTriangle className="h-3 w-3 text-plum-900" />
            リンク切れ
          </span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          发现资源打不开？告诉我们哪里出了问题，我们会尽快处理。你也可以直接在资源详情页点「失效反馈」，会自动带上资源地址 ✨
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        {/* 左：表单或成功态 */}
        {submitted ? (
          <SuccessCard
            onReset={() => {
              setSubmitted(false);
              setResourceUrl("");
              setDeadLink("");
              setReason("dead");
              setNote("");
              setContact("");
              setError(null);
            }}
          />
        ) : (
          <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
            <Field label="资源页地址" required>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-500" />
                <input
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://zhuifanhub.com/resource/xxx"
                  className="input pl-11"
                />
              </div>
              <p className="mt-2 font-display text-xs text-plum-500">
                复制你在站内看到的资源详情页链接粘贴到这里
              </p>
            </Field>

            <Field label="失效的下载链接（可选）">
              <input
                value={deadLink}
                onChange={(e) => setDeadLink(e.target.value)}
                placeholder="https:// 或 magnet:"
                className="input"
              />
              <p className="mt-2 font-display text-xs text-plum-500">
                如果一条资源下有多个链接，告诉我们是哪一条出问题
              </p>
            </Field>

            <Field label="问题类型" required>
              <div className="grid gap-3 md:grid-cols-2">
                {REASONS.map((r) => (
                  <ReasonButton
                    key={r.key}
                    active={reason === r.key}
                    label={r.label}
                    desc={r.desc}
                    onClick={() => setReason(r.key)}
                  />
                ))}
              </div>
            </Field>

            <Field label="补充说明（可选）">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="例如：提示「该文件涉及违规已删除」/ 下载到一半断开 / 提取码 1234 不对…"
                className="input resize-none"
              />
            </Field>

            <Field label="你的联系方式（可选）">
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="邮箱或站内 ID，方便我们处理后通知你"
                className="input"
              />
            </Field>

            {error && (
              <div className="rounded-2xl border-2 border-sakura-500 bg-sakura-100 px-4 py-3 font-display text-sm text-sakura-700">
                {error}
                {!user && (
                  <Link
                    href="/login?next=/feedback"
                    className="ml-2 underline"
                  >
                    去登录
                  </Link>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className={clsx(
                  "btn-sakura",
                  !canSubmit &&
                    "cursor-not-allowed opacity-50 hover:translate-x-0 hover:translate-y-0"
                )}
              >
                <Send className="h-4 w-4" />
                {submitting ? "提交中..." : "提交反馈"}
              </button>
              <span className="font-display text-xs text-plum-500">
                所有反馈都会匿名处理，我们不会公开你的联系方式
              </span>
            </div>
          </form>
        )}

        {/* 右：说明 */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border-[3px] border-plum-900 bg-sky2-100 p-6 shadow-pop">
            <div className="mb-3 flex items-center gap-2 font-pop text-sm text-plum-900">
              <Info className="h-4 w-4" />
              我们会怎么处理？
            </div>
            <ol className="space-y-3 font-display text-xs leading-relaxed text-plum-900">
              <li>1. 志愿者会在 24 小时内验证你提交的链接是否确实失效</li>
              <li>2. 若确认失效，会在资源详情页打上「失效」标签并通知原发布者</li>
              <li>3. 原发布者在 72 小时内可补发新链接，否则资源会被下架</li>
              <li>4. 你留下联系方式的话，处理完会私信通知你</li>
            </ol>
          </div>

          <div className="rounded-3xl border-[3px] border-plum-900 bg-lavender-100 p-6 shadow-pop">
            <div className="mb-2 font-pop text-sm text-plum-900">小贴士</div>
            <p className="font-display text-xs leading-relaxed text-plum-700">
              如果你是来反馈版权问题，请不要通过本表单。版权投诉需要通过「联系我们」页面的专用邮箱，并附上相关证明材料 🌸
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 问题类型按钮：两行结构，第一行是标签，第二行是说明
function ReasonButton({
  active,
  label,
  desc,
  onClick,
}: {
  active: boolean;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-2xl border-[3px] p-4 text-left transition-all",
        active
          ? "border-plum-900 bg-sakura-200 shadow-pop"
          : "border-plum-900/20 bg-white hover:border-plum-900 hover:shadow-pop"
      )}
    >
      <div className="font-pop text-sm text-plum-900">{label}</div>
      <div className="mt-1 font-display text-xs text-plum-700">{desc}</div>
    </button>
  );
}

// 表单字段包装：保持与 publish 页一致的间距
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 font-pop text-sm text-plum-900">
        {label}
        {required && <span className="text-sakura-600">*</span>}
      </label>
      {children}
    </div>
  );
}

// 提交成功卡片：用同一列展示，避免跳转
function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="bubble flex flex-col items-center gap-4 p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-plum-900 bg-mint-300 shadow-pop">
        <CheckCircle2 className="h-7 w-7 text-plum-900" />
      </div>
      <h2 className="font-pop text-3xl text-plum-900">反馈已收到 🌸</h2>
      <p className="max-w-md font-display text-sm leading-relaxed text-plum-700">
        感谢你让这个站点变得更可靠！我们会尽快验证这条资源，如果你留下了联系方式，处理完会通知你。
      </p>
      <button type="button" onClick={onReset} className="btn-outline mt-2">
        再提交一条
      </button>
    </div>
  );
}
