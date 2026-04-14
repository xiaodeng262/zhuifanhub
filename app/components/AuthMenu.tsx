"use client";

import Link from "next/link";
import { UserRound, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "./AuthProvider";

/*
 * Header 登录状态组件
 * 数据源：AuthProvider 的全局 context
 * 三态渲染：
 * - 尚未首次拉取完成：占位小圆，避免闪烁
 * - 已登录：用户名胶囊 + 登出按钮
 * - 未登录：登录入口
 */
export function AuthMenu() {
  const { user, loaded, logout } = useAuth();

  if (!loaded) {
    return (
      <div
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-plum-900 bg-milk-200"
      >
        <div className="h-3 w-3 animate-pulse rounded-full bg-sakura-300" />
      </div>
    );
  }

  if (user) {
    const isAdmin = user.role === "admin";
    return (
      <div className="flex shrink-0 items-center gap-2">
        {/* 用户胶囊：
         * - 默认态（<xl）：44x44 圆形按钮，仅头像字母，与其它铃铛/登出按钮视觉一致
         * - xl+：展开成横向胶囊，显示用户名 + ADMIN 徽章
         * 统一用一个 Link，通过 Tailwind 响应式类切换尺寸，避免 DOM 双份
         */}
        <Link
          href="/me"
          aria-label={user.username}
          className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border-[3px] border-plum-900 bg-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-sakura-100 xl:h-auto xl:w-auto xl:justify-start xl:px-3 xl:py-1.5"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sakura-300 font-pop text-[11px] text-plum-900">
            {user.username[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="hidden max-w-[120px] truncate whitespace-nowrap font-display text-sm font-bold text-plum-900 xl:inline">
            {user.username}
          </span>
          {isAdmin && (
            <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-lavender-300 px-2 py-0.5 font-pop text-[9px] text-plum-900 xl:inline">
              ADMIN
            </span>
          )}
        </Link>
        {/* 管理员快捷入口：仅 role=admin 可见 */}
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="管理后台"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-plum-900 bg-lavender-300 text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-lavender-500"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Link>
        )}
        <button
          onClick={logout}
          aria-label="退出登录"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-plum-900 bg-white text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-sakura-100"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      aria-label="登录"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-plum-900 bg-white text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-lavender-100"
    >
      <UserRound className="h-4 w-4" />
    </Link>
  );
}
