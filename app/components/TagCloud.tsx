"use client";

import clsx from "clsx";
import { HOT_TAGS } from "@/lib/data";
import { Sparkles } from "lucide-react";

/*
 * 热门标签云 v2 · 卡通 Pop
 * - 标签使用四种彩色循环
 * - 激活标签高亮为樱花粉 + 白字
 * - 字号按伪随机档位变化
 */

interface Props {
  active: string[];
  onToggle: (tag: string) => void;
}

// 固定伪随机字号：保证 SSR/CSR 一致
function tagSize(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h << 5) - h + tag.charCodeAt(i);
  const size = Math.abs(h) % 5;
  return ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"][size];
}

// 伪随机取色档
function tagColor(tag: string, active: boolean): string {
  if (active) {
    return "bg-sakura-500 border-plum-900 text-white shadow-pop";
  }
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h << 5) - h + tag.charCodeAt(i);
  const colors = [
    "bg-sakura-100 border-sakura-300 text-sakura-700 hover:bg-sakura-200",
    "bg-sky2-100 border-sky2-400 text-sky2-600 hover:bg-sky2-200",
    "bg-lavender-100 border-lavender-300 text-lavender-700 hover:bg-lavender-300",
    "bg-vanilla-100 border-vanilla-500 text-vanilla-700 hover:bg-vanilla-300",
    "bg-mint-100 border-mint-300 text-mint-500 hover:bg-mint-300",
  ];
  return colors[Math.abs(h) % colors.length];
}

export function TagCloud({ active, onToggle }: Props) {
  return (
    <div className="bubble p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 font-pop text-2xl text-plum-900">
          <Sparkles className="h-5 w-5 fill-vanilla-500 text-vanilla-500" />
          热门标签
        </h2>
        <span className="marker">TAG CLOUD</span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {HOT_TAGS.map((tag) => {
          const isActive = active.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={clsx(
                "rounded-full border-[3px] px-4 py-1.5 font-pop transition-all hover:-translate-y-0.5",
                tagSize(tag),
                tagColor(tag, isActive)
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
