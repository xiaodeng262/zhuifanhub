"use client";

import { useMemo, useState } from "react";
import type { Resource } from "@/lib/types";
import { FilterBar, type FilterTab } from "./FilterBar";
import { ResourceCard } from "./ResourceCard";
import { TagCloud } from "./TagCloud";
import { Inbox } from "lucide-react";

/*
 * 资源探索区 v2 · 卡通 Pop
 * - 维护 tab / 搜索词 / 资源类型 / 已选标签状态
 * - 在本地通过 useMemo 过滤数据
 * - 空状态使用可爱的气泡样式
 */
export function ResourceExplorer({
  initialResources,
}: {
  initialResources: Resource[];
}) {
  const [tab, setTab] = useState<FilterTab>("latest");
  const [query, setQuery] = useState("");
  const [storage, setStorage] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  // 过滤 + 排序逻辑：由多个条件组合得出最终列表
  const filtered = useMemo(() => {
    let list = [...initialResources];

    // tab 决定基础分组
    if (tab === "seek") list = list.filter((r) => r.kind === "seek");
    else list = list.filter((r) => r.kind === "share");

    // 搜索词
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) =>
        [r.title, r.alias ?? "", r.description, r.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // 资源类型过滤
    if (storage) {
      list = list.filter((r) => r.links.some((l) => l.storage === storage));
    }

    // 标签过滤：AND 语义
    if (activeTags.length > 0) {
      list = list.filter((r) => activeTags.every((t) => r.tags.includes(t)));
    }

    // 排序
    if (tab === "hot") {
      list.sort((a, b) => b.stats.views - a.stats.views);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }

    return list;
  }, [initialResources, tab, query, storage, activeTags]);

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        tab={tab}
        onTabChange={setTab}
        query={query}
        onQueryChange={setQuery}
        storage={storage}
        onStorageChange={setStorage}
        activeTags={activeTags}
        onToggleTag={toggleTag}
      />

      {/* 结果计数条 */}
      <div className="flex items-center justify-between rounded-full border-2 border-dashed border-plum-900/20 bg-white/50 px-5 py-2 font-display text-xs font-bold text-plum-700">
        <span>🎯 共 {filtered.length} 条结果</span>
        <span>
          {tab === "latest" && "按发布时间"}
          {tab === "hot" && "按人气热度"}
          {tab === "seek" && "求助贴"}
        </span>
      </div>

      {/* 卡片列表 */}
      {filtered.length > 0 ? (
        <div className="grid gap-5">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* 底部标签云 */}
      <div className="mt-8">
        <TagCloud active={activeTags} onToggle={toggleTag} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bubble flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-plum-900 bg-vanilla-200">
        <Inbox className="h-8 w-8 text-plum-900" />
      </div>
      <p className="font-pop text-2xl text-plum-900">没找到符合的资源 🥺</p>
      <p className="max-w-sm font-display text-sm text-plum-700">
        换个关键字，或把筛选条件放宽一些。也可以直接去求助区发一帖，很快就会有人看到～
      </p>
    </div>
  );
}
