"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/*
 * 顶部搜索框（客户端组件）
 *
 * 独立成一个小组件而不是把整个 SiteHeader 改成 client，
 * 原因是 SiteHeader 其它部分都是纯静态链接，没必要一起提到客户端。
 *
 * 交互：按 Enter 跳转到 /search?q=...
 * 空关键字不触发跳转（防止误触）。
 */
export function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit() {
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    // shrink-0：确保搜索条不会在登录后被其它按钮挤压
    // 输入框宽度分档：md=28, xl=44，避免中等屏幕下吃掉导航空间
    <div className="group hidden shrink-0 items-center gap-2 rounded-full border-[3px] border-plum-900 bg-white px-3 py-2 transition-all hover:shadow-pop md:flex">
      <Search className="h-4 w-4 shrink-0 text-sakura-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="搜索番剧 / 标签"
        className="w-28 bg-transparent text-sm text-plum-900 placeholder:text-plum-500/50 focus:outline-none xl:w-44"
      />
      {/* 回车提示键帽：仅极宽屏显示，避免挤占宽度 */}
      <kbd className="hidden shrink-0 font-mono text-[10px] font-bold text-plum-500 xl:inline">
        ↵
      </kbd>
    </div>
  );
}
