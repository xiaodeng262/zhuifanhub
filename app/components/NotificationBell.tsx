"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, MessageCircle, AtSign, Check } from "lucide-react";
import { useAuth } from "./AuthProvider";

/*
 * Header 通知铃铛 + 下拉面板
 *
 * 数据来源：GET /api/notifications（懒加载，仅登录时调用）
 * 交互：
 * - 登录后首次 mount 时拉一次，取得 unreadCount 显示红点
 * - 点击铃铛打开下拉，打开时再拉一次最新列表（避免长时间停留数据陈旧）
 * - 点击"全部已读"调用 POST /api/notifications/read 清零
 * - 点击单条通知跳转对应资源页（锚到评论区），并把该条标记为已读
 *
 * 轮询策略：暂不做（MVP）。用户频繁切换页面/刷新时能自然更新。
 * 后续如需实时推送，可把 fetchSummary 改为 SSE 连接。
 */

type NotificationType = "reply" | "mention";

type NotificationItem = {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  resourceId: string | null;
  commentId: string | null;
  snippet: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const { user, loaded } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // 拉取通知列表 + 未读数
  const fetchSummary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: NotificationItem[];
        unreadCount: number;
      };
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      // 静默：铃铛挂掉不应该阻塞 Header 其它功能
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 登录状态变化时自动拉一次；登出时清空
  useEffect(() => {
    if (!loaded) return;
    if (user) {
      fetchSummary();
    } else {
      setItems([]);
      setUnread(0);
    }
  }, [user, loaded, fetchSummary]);

  // 点击外部区域关闭下拉
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // 打开下拉时顺便刷新一次，确保数据新鲜
  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchSummary();
  };

  // 全部已读
  const markAllRead = async () => {
    if (unread === 0) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      // 乐观：清空未读 + 本地列表里的 read 置 true
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // 失败不提示，用户可以再次点
    }
  };

  // 点击单条通知：标记已读 + 跳转
  // 返回 href，让 Link 本身负责跳转，这里只处理已读副作用
  const handleItemClick = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.read) {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [n.id] }),
        });
      } catch {
        // 忽略
      }
      setUnread((v) => Math.max(0, v - 1));
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    }
  };

  // 未登录/尚未拉完：不渲染
  if (!loaded || !user) return null;

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        onClick={togglePanel}
        aria-label="通知"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-plum-900 bg-white text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-vanilla-100"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            aria-label={`${unread} 条未读`}
            className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-plum-900 bg-sakura-500 px-1 font-pop text-[10px] font-bold text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[360px] overflow-hidden rounded-3xl border-[3px] border-plum-900 bg-milk-100 shadow-pop">
          {/* 顶部 title + 全部已读 */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-plum-900/20 bg-sakura-100 px-4 py-3">
            <span className="font-pop text-sm text-plum-900">通知中心</span>
            <button
              onClick={markAllRead}
              disabled={unread === 0}
              className="flex items-center gap-1 font-pop text-[11px] text-plum-700 hover:text-sakura-700 disabled:text-plum-400"
            >
              <Check className="h-3 w-3" />
              全部已读
            </button>
          </div>

          {/* 列表区 */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center font-display text-xs text-plum-500">
                加载中…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center font-display text-xs text-plum-500">
                还没有新的通知 ✨
              </p>
            ) : (
              <ul className="divide-y-2 divide-dashed divide-plum-900/10">
                {items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    item={n}
                    onClick={() => handleItemClick(n)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * 单条通知行
 * 结构：图标 · 主标题（actor + 动作） · 摘要 · 时间
 * 未读时左侧一条彩色竖条标记
 */
function NotificationRow({
  item,
  onClick,
}: {
  item: NotificationItem;
  onClick: () => void;
}) {
  const Icon = item.type === "reply" ? MessageCircle : AtSign;
  const title =
    item.type === "reply"
      ? `${item.actorName} 回复了你`
      : `${item.actorName} 提到了你`;

  // 资源 id 存在时跳详情并锚定评论；否则默认跳通知页（MVP 留空）
  const href = item.resourceId
    ? item.commentId
      ? `/resource/${item.resourceId}#comment-${item.commentId}`
      : `/resource/${item.resourceId}`
    : "#";

  return (
    <li className={item.read ? "" : "bg-vanilla-100/40"}>
      <Link
        href={href}
        onClick={onClick}
        className="flex gap-3 px-4 py-3 transition-colors hover:bg-sakura-100/60"
      >
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-plum-900 ${
            item.type === "reply" ? "bg-sky2-200" : "bg-lavender-300"
          }`}
        >
          <Icon className="h-4 w-4 text-plum-900" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!item.read && (
              <span className="h-2 w-2 rounded-full bg-sakura-500" />
            )}
            <span className="truncate font-pop text-sm text-plum-900">
              {title}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 font-display text-xs text-plum-700">
            {item.snippet}
          </p>
          <p className="mt-1 font-mono text-[10px] text-plum-500">
            {formatTime(item.createdAt)}
          </p>
        </div>
      </Link>
    </li>
  );
}

// 相对时间：与 CommentSection 里的一致
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
