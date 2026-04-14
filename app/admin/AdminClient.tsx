"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Flag,
  ShieldAlert,
  ListFilter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import clsx from "clsx";
import {
  STATUS_LABEL,
  CONTENT_REASON_LABEL,
  type ReportRecord,
  type ReportStatus,
} from "@/lib/reports";
import { relativeTime } from "@/lib/format";

/*
 * 管理后台客户端 UI
 *
 * 初始数据由父级 server component 通过 props 注入（records + stats），
 * 避免客户端再发一次 /api/admin/reports——进入页面就有内容可渲染。
 *
 * 操作按钮走真实 PATCH /api/admin/reports/[id]：
 * - 成功后用服务端返回的记录替换本地 state（以服务端为准，避免漂移）
 * - 失败则 toast + 不改 state
 *
 * 筛选 tab / status filter 保留客户端纯本地实现：切换频繁且数据量小，
 * 再跑一轮 fetch 反而慢。
 */

type Tab = "all" | "content" | "dead";
type StatusFilter = "all" | ReportStatus;

type StatsShape = {
  total: number;
  pending: number;
  content: number;
  dead: number;
};

export function AdminClient({
  initialRecords,
  initialStats,
}: {
  initialRecords: ReportRecord[];
  initialStats: StatsShape;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [records, setRecords] = useState<ReportRecord[]>(initialRecords);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // 统计数据：如果想让它随状态变化实时重算，可改为 useMemo
  // MVP 阶段沿用父级传入的 stats，待页面刷新时再更新顶部卡片
  const stats = initialStats;

  const filtered = useMemo(() => {
    let list = [...records];
    if (tab !== "all") list = list.filter((r) => r.kind === tab);
    if (statusFilter !== "all")
      list = list.filter((r) => r.status === statusFilter);
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }, [records, tab, statusFilter]);

  async function updateStatus(id: string, status: ReportStatus) {
    setBusyIds((prev) => new Set(prev).add(id));
    setToast(null);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as {
        report?: ReportRecord;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error || "更新失败");
      }
      // 以服务端返回为准替换本地记录
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? data.report! : r))
      );
    } catch (err) {
      setToast(err instanceof Error ? err.message : "更新失败，请重试");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      {/* 顶部：标题栏 */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border-[3px] border-plum-900 bg-lavender-300 px-4 py-1.5 font-pop text-xs text-plum-900 shadow-pop">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Admin Console
        </div>
        <h1 className="font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          举报与反馈
          <span className="ml-2">🛡</span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          这里汇总所有用户提交的内容举报和失效反馈。处理后会进入已处理列表，恶意举报可以驳回 ✨
        </p>
      </div>

      {/* 顶部：四张统计卡 */}
      <section className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="总计"
          value={stats.total}
          icon={<ListFilter className="h-5 w-5" />}
          color="bg-milk-200"
        />
        <StatCard
          label="待处理"
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
          color="bg-vanilla-300"
          highlight
        />
        <StatCard
          label="内容举报"
          value={stats.content}
          icon={<Flag className="h-5 w-5" />}
          color="bg-sakura-200"
        />
        <StatCard
          label="失效反馈"
          value={stats.dead}
          icon={<ShieldAlert className="h-5 w-5" />}
          color="bg-sky2-200"
        />
      </section>

      {/* 错误 toast */}
      {toast && (
        <div className="mb-6 rounded-2xl border-2 border-sakura-500 bg-sakura-100 px-4 py-3 font-display text-sm text-sakura-700">
          {toast}
        </div>
      )}

      {/* 筛选栏 */}
      <section className="bubble mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-plum-900/15 px-5 py-4 md:px-6">
          {/* 类型 tab */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: "all", label: "全部", icon: ListFilter, color: "bg-milk-200" },
                { key: "content", label: "内容举报", icon: Flag, color: "bg-sakura-300" },
                { key: "dead", label: "失效反馈", icon: ShieldAlert, color: "bg-sky2-200" },
              ] as { key: Tab; label: string; icon: typeof Flag; color: string }[]
            ).map((t) => {
              const Icon = t.icon;
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 px-4 py-2 font-pop text-sm transition-all",
                    active
                      ? `${t.color} text-plum-900 shadow-pop`
                      : "bg-white text-plum-700 hover:bg-milk-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* 状态筛选 */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="cursor-pointer appearance-none rounded-full border-[3px] border-plum-900 bg-white px-5 py-2 pr-10 font-display text-sm font-bold text-plum-900 focus:outline-none focus:ring-4 focus:ring-sakura-100"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已处理</option>
              <option value="rejected">已驳回</option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-plum-900">
              ▾
            </span>
          </div>
        </div>

        <div className="px-5 py-3 font-display text-xs font-bold text-plum-700 md:px-6">
          🎯 共 {filtered.length} 条记录
        </div>
      </section>

      {/* 列表 */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((r) => (
            <ReportCard
              key={r.id}
              record={r}
              onUpdate={updateStatus}
              busy={busyIds.has(r.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// 统计卡片
function StatCard({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-3xl border-[3px] border-plum-900 p-5 shadow-pop",
        color,
        highlight && "animate-pulse"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-plum-700">
          {label}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-plum-900 bg-white text-plum-900">
          {icon}
        </span>
      </div>
      <div className="mt-3 font-pop text-4xl text-plum-900">{value}</div>
    </div>
  );
}

// 单条举报卡片
function ReportCard({
  record,
  onUpdate,
  busy,
}: {
  record: ReportRecord;
  onUpdate: (id: string, status: ReportStatus) => void;
  busy: boolean;
}) {
  const isContent = record.kind === "content";
  const kindColor = isContent
    ? "bg-sakura-300 text-plum-900"
    : "bg-sky2-200 text-plum-900";

  return (
    <div className={clsx("bubble p-5 md:p-6", busy && "opacity-60")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* 左：主信息 */}
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border-2 border-plum-900 px-3 py-0.5 font-pop text-[11px] ${kindColor}`}
            >
              {isContent ? (
                <Flag className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              {isContent ? "内容举报" : "失效反馈"}
            </span>
            {isContent && record.reason && (
              <span className="rounded-full border-2 border-sakura-300 bg-sakura-100 px-2.5 py-0.5 font-display text-[11px] font-bold text-sakura-700">
                {CONTENT_REASON_LABEL[record.reason]}
              </span>
            )}
            <StatusBadge status={record.status} />
            <span className="font-mono text-[10px] text-plum-500">
              #{record.id.slice(0, 8)}
            </span>
          </div>

          <Link
            href={`/resource/${record.resourceId}`}
            className="group inline-flex items-center gap-1.5 font-pop text-xl text-plum-900 hover:text-sakura-600"
          >
            {record.resourceTitle}
            <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {record.note && (
            <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-milk-200 p-3 font-display text-sm leading-relaxed text-plum-700">
              💬 {record.note}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 font-display text-xs text-plum-500">
            <span>
              举报人：
              <span className="font-bold text-plum-900">{record.reporter}</span>
            </span>
            <span>{relativeTime(record.createdAt)}</span>
          </div>
        </div>

        {/* 右：操作按钮 */}
        <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
          {record.status === "pending" && (
            <>
              <ActionBtn
                icon={<Loader2 className="h-3.5 w-3.5" />}
                label="开始处理"
                color="bg-vanilla-300 hover:bg-vanilla-500"
                onClick={() => onUpdate(record.id, "processing")}
                disabled={busy}
              />
              <ActionBtn
                icon={<XCircle className="h-3.5 w-3.5" />}
                label="驳回"
                color="bg-white hover:bg-milk-200"
                onClick={() => onUpdate(record.id, "rejected")}
                disabled={busy}
              />
            </>
          )}
          {record.status === "processing" && (
            <>
              <ActionBtn
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                label="标为已处理"
                color="bg-mint-300 hover:bg-mint-500 hover:text-white"
                onClick={() => onUpdate(record.id, "resolved")}
                disabled={busy}
              />
              <ActionBtn
                icon={<XCircle className="h-3.5 w-3.5" />}
                label="驳回"
                color="bg-white hover:bg-milk-200"
                onClick={() => onUpdate(record.id, "rejected")}
                disabled={busy}
              />
            </>
          )}
          {(record.status === "resolved" || record.status === "rejected") && (
            <ActionBtn
              icon={<Clock className="h-3.5 w-3.5" />}
              label="恢复待处理"
              color="bg-white hover:bg-milk-200"
              onClick={() => onUpdate(record.id, "pending")}
              disabled={busy}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// 状态徽章
function StatusBadge({ status }: { status: ReportStatus }) {
  const colorMap: Record<ReportStatus, string> = {
    pending: "bg-vanilla-100 text-vanilla-700 border-vanilla-500",
    processing: "bg-lavender-100 text-lavender-700 border-lavender-300",
    resolved: "bg-mint-100 text-mint-500 border-mint-300",
    rejected: "bg-milk-200 text-plum-700 border-plum-900/20",
  };
  return (
    <span
      className={`rounded-full border-2 px-2.5 py-0.5 font-display text-[11px] font-bold ${colorMap[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// 操作按钮
function ActionBtn({
  icon,
  label,
  color,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border-[3px] border-plum-900 px-3 py-1.5 font-pop text-[11px] text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_0_#2d1b3d] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 ${color}`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="bubble flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-plum-900 bg-mint-300">
        <Sparkles className="h-8 w-8 text-plum-900" />
      </div>
      <p className="font-pop text-2xl text-plum-900">所有举报都处理完啦 🎉</p>
      <p className="max-w-sm font-display text-sm text-plum-700">
        当前筛选条件下没有待处理的记录，辛苦啦！
      </p>
    </div>
  );
}
