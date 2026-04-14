import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { ArrowRight } from "lucide-react";

/*
 * 分类栏 v2 · 卡通 Pop
 * - 每个分类卡片颜色不同（循环四色）
 * - 黑描边 + 硬边阴影 + 轻微倾斜 hover
 */
export function CategoryRail() {
  // 循环配色：粉 / 蓝 / 紫 / 黄 / 薄荷
  const cardColors = [
    "bg-sakura-100 hover:bg-sakura-200",
    "bg-sky2-100 hover:bg-sky2-200",
    "bg-lavender-100 hover:bg-lavender-300",
    "bg-vanilla-100 hover:bg-vanilla-300",
    "bg-mint-100 hover:bg-mint-300",
  ];

  return (
    <aside className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-pop text-2xl text-plum-900">分类目录</h2>
        <span className="marker">CONTENTS</span>
      </div>

      <ul className="flex flex-col gap-3">
        {CATEGORIES.map((c, i) => (
          <li key={c.key}>
            <Link
              href={`/category/${c.key}`}
              className={`group block rounded-3xl border-[3px] border-plum-900 ${cardColors[i % cardColors.length]} p-4 shadow-pop transition-all hover:-translate-y-1 hover:-translate-x-0.5 hover:rotate-[-1deg] hover:shadow-[6px_6px_0_0_#2d1b3d]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-pop text-xs text-sakura-700">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-pop text-base text-plum-900">
                      {c.name}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-[11px] font-bold text-plum-700">
                    {c.kana}
                  </p>
                  <p className="mt-2 font-display text-xs leading-relaxed text-plum-700/80">
                    {c.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-plum-900 transition-all group-hover:translate-x-1" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
