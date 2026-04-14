"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bookmark,
  PenLine,
  Inbox,
  MessageSquareWarning,
  Flag,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import type { Resource } from "@/lib/types";
import {
  STATUS_LABEL,
  CONTENT_REASON_LABEL,
  type ReportRecord,
  type ReportStatus,
} from "@/lib/reports";
import { relativeTime } from "@/lib/format";
import { ResourceCard } from "@/app/components/ResourceCard";

/*
 * 个人中心 tab 组件（客户端）
 *
 * 三个 tab：
 * - collections: 我的收藏
 * - resources:   我的发布
 * - reports:     我的反馈（自己提交的举报 / 失效反馈 + 管理员处理状态）
 *
 * 数据由 server 父组件预先 SSR 注入 props，切换 tab 纯本地 state，
 * 无需再发请求。ResourceCard 本身不依赖 useState/useEffect，是一个
 * 纯装饰型组件，可直接在客户端组件里导入使用；
 * 之前用 renderCard 函数 prop 注入的方式在 Server→Client 传递时
 * 会触发 "Functions cannot be passed directly to Client Components"，
 * 因此改为组件内部直接引用。
 *
 * 「我的反馈」tab 的意义：补齐用户视角的处理反馈链路——之前
 * 用户提交完只能看到「反馈已收到」，之后完全失联；现在可以看到
 * 管理员是把它标为「已处理」还是「已驳回」，避免用户觉得反馈石沉大海。
 *
 * 空态三个 tab 各自有专属文案。
 */

type Tab = "collections" | "resources" | "reports";

export function MeTabs({
  myResources,
  myCollections,
  myReports,
}: {
  myResources: Resource[];
  myCollections: Resource[];
  myReports: ReportRecord[];
}) {
  const [tab, setTab] = useState<Tab>("collections");

  return (
    <section>
      {/* Tab 头 */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <TabButton
          active={tab === "collections"}
          onClick={() => setTab("collections")}
          icon={<Bookmark className="h-4 w-4" />}
          label="我的收藏"
          count={myCollections.length}
          color="bg-sky2-200"
        />
        <TabButton
          active={tab === "resources"}
          onClick={() => setTab("resources")}
          icon={<PenLine className="h-4 w-4" />}
          label="我的发布"
          count={myResources.length}
          color="bg-sakura-300"
        />
        <TabButton
          active={tab === "reports"}
          onClick={() => setTab("reports")}
          icon={<MessageSquareWarning className="h-4 w-4" />}
          label="我的反馈"
          count={myReports.length}
          color="bg-vanilla-300"
        />
      </div>

      {/* 列表 / 空态 */}
      {tab === "reports" ? (
        myReports.length > 0 ? (
          <div className="flex flex-col gap-4">
            {myReports.map((r) => (
              <ReportItem key={r.id} record={r} />
            ))}
          </div>
        ) : (
          <EmptyState tab="reports" />
        )
      ) : (() => {
        const list = tab === "collections" ? myCollections : myResources;
        return list.length > 0 ? (
          <div className="grid gap-5">
            {list.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <EmptyState tab={tab} />
        );
      })()}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 px-4 py-2 font-pop text-sm transition-all",
        active
          ? `${color} text-plum-900 shadow-pop`
          : "bg-white text-plum-700 hover:bg-milk-200"
      )}
    >
      {icon}
      {label}
      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/60 px-1.5 font-mono text-[11px] text-plum-900">
        {count}
      </span>
    </button>
  );
}

/*
 * 单条反馈卡片（用户视角）
 * 与 admin 版本相比去掉了「操作按钮」和「举报人」字段，
 * 保留资源链接、类型徽章、状态徽章、备注、时间，
 * 让用户一眼看出「我反馈的那条现在怎么样了」。
 */
function ReportItem({ record }: { record: ReportRecord }) {
  const isContent = record.kind === "content";
  const kindColor = isContent
    ? "bg-sakura-300 text-plum-900"
    : "bg-sky2-200 text-plum-900";

  return (
    <div className="bubble p-5 md:p-6">
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
      </div>

      <Link
        href={`/resource/${record.resourceId}`}
        className="group inline-flex items-center gap-1.5 font-pop text-lg text-plum-900 hover:text-sakura-600"
      >
        {record.resourceTitle}
        <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {record.note && (
        <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-milk-200 p-3 font-display text-sm leading-relaxed text-plum-700">
          💬 {record.note}
        </p>
      )}

      <div className="mt-3 font-display text-xs text-plum-500">
        {relativeTime(record.createdAt)}提交
      </div>
    </div>
  );
}

/*
 * 状态徽章：四种状态四种配色，用户一眼分辨处理结果
 * 已驳回用暗色：避免用户误以为是"还能处理"
 */
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

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === "reports") {
    return (
      <div className="bubble flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-plum-900 bg-vanilla-200">
          <MessageSquareWarning className="h-8 w-8 text-plum-900" />
        </div>
        <p className="font-pop text-2xl text-plum-900">还没有提交过反馈 🌱</p>
        <p className="max-w-sm font-display text-sm text-plum-700">
          遇到资源打不开？或者发现了不合适的内容？在资源详情页点「失效反馈」或「举报」，提交后会出现在这里，方便你追踪处理进度。
        </p>
        <Link href="/feedback" className="btn-sakura mt-2 !py-2 !px-5 text-xs">
          去反馈页看看
        </Link>
      </div>
    );
  }

  const isCollections = tab === "collections";
  return (
    <div className="bubble flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-plum-900 bg-vanilla-200">
        <Inbox className="h-8 w-8 text-plum-900" />
      </div>
      <p className="font-pop text-2xl text-plum-900">
        {isCollections ? "还没有收藏 🥺" : "还没有发布过资源"}
      </p>
      <p className="max-w-sm font-display text-sm text-plum-700">
        {isCollections
          ? "去广场逛逛，看到心仪的资源点「收藏」就会出现在这里"
          : "点顶部的「发布」按钮，分享你珍藏的资源，或者发一条求助贴"}
      </p>
      <Link
        href={isCollections ? "/" : "/publish"}
        className="btn-sakura mt-2 !py-2 !px-5 text-xs"
      >
        {isCollections ? "去广场看看" : "开始发布"}
      </Link>
    </div>
  );
}
