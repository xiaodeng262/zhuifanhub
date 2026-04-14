"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, Sparkles, Flame, HelpCircle } from "lucide-react";
import clsx from "clsx";

/*
 * 筛选栏 v2 · 卡通 Pop
 * - tab 使用贴纸按钮，选中时变粉底黑边
 * - 搜索/下拉全圆角
 * - 已选标签为粉色胶囊
 */

export type FilterTab = "latest" | "hot" | "seek";

interface Props {
  tab: FilterTab;
  onTabChange: (t: FilterTab) => void;
  query: string;
  onQueryChange: (q: string) => void;
  storage: string;
  onStorageChange: (s: string) => void;
  activeTags: string[];
  onToggleTag: (t: string) => void;
}

const TABS: {
  key: FilterTab;
  label: string;
  icon: typeof Sparkles;
  color: string;
}[] = [
  { key: "latest", label: "最新", icon: Sparkles, color: "bg-sakura-300" },
  { key: "hot", label: "热门", icon: Flame, color: "bg-vanilla-300" },
  { key: "seek", label: "求助", icon: HelpCircle, color: "bg-mint-300" },
];

const STORAGE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "pan", label: "网盘" },
  { value: "magnet", label: "磁力 / 种子" },
  { value: "online", label: "在线观看" },
  { value: "site", label: "追番站" },
];

export function FilterBar(props: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="bubble overflow-hidden">
      {/* 上方：Tab 切换 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-plum-900/15 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const active = t.key === props.tab;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => props.onTabChange(t.key)}
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

        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border-2 border-plum-900/30 bg-white px-3 py-2 font-display text-xs font-bold text-plum-700 transition-colors hover:border-plum-900 hover:bg-lavender-100"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          进阶筛选
        </button>
      </div>

      {/* 中部：搜索 + 类型选择 */}
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:px-6">
        <div className="flex flex-1 items-center gap-2 rounded-full border-[3px] border-plum-900 bg-white px-4 py-2.5 focus-within:shadow-pop">
          <Search className="h-4 w-4 text-sakura-500" />
          <input
            type="text"
            value={props.query}
            onChange={(e) => props.onQueryChange(e.target.value)}
            placeholder="搜番名、关键字… ✨"
            className="flex-1 bg-transparent text-sm text-plum-900 placeholder:text-plum-500/50 focus:outline-none"
          />
          {props.query && (
            <button
              onClick={() => props.onQueryChange("")}
              aria-label="清除"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-plum-900/10 text-plum-700 hover:bg-sakura-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={props.storage}
            onChange={(e) => props.onStorageChange(e.target.value)}
            className="cursor-pointer appearance-none rounded-full border-[3px] border-plum-900 bg-white px-5 py-2.5 pr-10 font-display text-sm font-bold text-plum-900 focus:outline-none focus:ring-4 focus:ring-sakura-100"
          >
            {STORAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-plum-900">
            ▾
          </span>
        </div>
      </div>

      {/* 进阶筛选：标签区 */}
      {advancedOpen && (
        <div className="border-t-2 border-dashed border-plum-900/15 bg-milk-200/50 px-5 py-4 md:px-6">
          <div className="marker mb-3">已选标签</div>
          <div className="flex flex-wrap gap-2">
            {props.activeTags.length === 0 && (
              <span className="font-display text-xs text-plum-500">
                点击下方热门标签快速筛选 ↓
              </span>
            )}
            {props.activeTags.map((t) => (
              <button
                key={t}
                onClick={() => props.onToggleTag(t)}
                className="inline-flex items-center gap-1 rounded-full border-2 border-plum-900 bg-sakura-500 px-3 py-1 font-pop text-xs text-white transition-all hover:bg-sakura-600"
              >
                {t}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
