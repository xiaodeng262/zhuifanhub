import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { listResources } from "@/lib/store/resources";
import type { Category } from "@/lib/types";
import { ResourceExplorer } from "@/app/components/ResourceExplorer";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";

// 强制动态渲染：分类列表实时查 DB，禁止 build 阶段静态预渲染
export const dynamic = "force-dynamic";

/*
 * 分类详情页 v2 · 卡通 Pop
 * - 顶部大号 Mochiy Pop 标题 + 背景 emoji 装饰
 * - 列表区复用 ResourceExplorer
 */

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = CATEGORIES.find((c) => c.key === (slug as Category));
  if (!meta) return notFound();

  // 从资源 store 查询，已自动过滤软删除
  const { items: list } = await listResources({
    category: meta.key,
    pageSize: 0,
  });

  // 按分类给 Hero 一个不同的背景色
  const heroColor: Record<Category, string> = {
    "new-anime": "bg-sakura-200",
    classic: "bg-lavender-300",
    movie: "bg-sky2-200",
    artwork: "bg-vanilla-300",
    tool: "bg-mint-300",
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      {/* 分类标题大栏 */}
      <header
        className={`relative mb-14 overflow-hidden rounded-blob border-[3px] border-plum-900 ${heroColor[meta.key]} p-10 shadow-pop lg:p-14`}
      >
        {/* 装饰大号 emoji */}
        <div className="pointer-events-none absolute -right-4 top-4 animate-float text-[12rem] leading-none opacity-40">
          {meta.key === "new-anime" && "🌸"}
          {meta.key === "classic" && "📚"}
          {meta.key === "movie" && "🎬"}
          {meta.key === "artwork" && "🎨"}
          {meta.key === "tool" && "🛠"}
        </div>

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border-[3px] border-plum-900 bg-white px-3 py-1 font-pop text-xs text-plum-900 shadow-pop">
            <Sparkles className="h-3 w-3 fill-vanilla-500 text-vanilla-500" />
            Category
          </div>
          <h1 className="font-pop text-6xl leading-tight text-plum-900 md:text-7xl">
            {meta.name}
          </h1>
          <p className="mt-3 font-display text-2xl font-bold text-plum-700">
            {meta.kana}
          </p>
          <p className="mt-6 max-w-2xl font-display text-base leading-relaxed text-plum-900">
            {meta.description}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-plum-900 bg-white px-4 py-2 font-pop text-xs text-plum-900 shadow-pop">
            🎯 共收录 {list.length} 条资源
          </div>
        </div>
      </header>

      <ResourceExplorer initialResources={list} />
    </div>
  );
}
