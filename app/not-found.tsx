import Link from "next/link";
import { Home, Search, Compass, Sparkles } from "lucide-react";

/*
 * 全局 404 页 /not-found
 *
 * 业务意图：
 * - 用户访问不存在的 URL 时承接落地，提供明确的下一步动作
 *   （回首页 / 去搜索 / 去分类广场）而不是死胡同
 * - 保留站点 Pop/Kawaii 风格，404 不破相
 *
 * 关键约束：
 * - 必须是 Server Component（Next.js not-found 约定不支持 "use client"）
 * - 不依赖任何运行时数据，完全静态，部署后任何错误都能渲染
 */
export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-[900px] flex-col items-center justify-center px-6 py-20 text-center">
      {/* 漂浮装饰星：呼应全站的糖果感 */}
      <Sparkles className="absolute left-12 top-12 h-6 w-6 animate-twinkle fill-vanilla-500 text-vanilla-500" />
      <Sparkles className="absolute right-16 top-24 h-5 w-5 animate-twinkle fill-sakura-500 text-sakura-500" />
      <Sparkles className="absolute bottom-20 left-24 h-4 w-4 animate-twinkle fill-lavender-300 text-lavender-300" />

      {/* 大 404 数字：作为视觉焦点 */}
      <div className="relative">
        <p className="font-pop text-[160px] leading-none text-sakura-500 md:text-[220px]">
          404
        </p>
        {/* 歪头的小色块：给枯燥的数字加一点生气 */}
        <div className="absolute -top-4 right-0 flex h-14 w-14 -rotate-12 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-vanilla-300 shadow-pop md:h-20 md:w-20">
          <Compass className="h-6 w-6 text-plum-900 md:h-10 md:w-10" />
        </div>
      </div>

      <p className="marker mt-4">Page Not Found · 迷路了</p>
      <h1 className="mt-3 font-pop text-3xl text-plum-900 md:text-4xl">
        这里什么都没有…
      </h1>
      <p className="mt-4 max-w-md font-display text-sm leading-relaxed text-plum-700 md:text-base">
        你找的这个页面可能已经搬家、被下架或者从来就不存在。
        <br />
        别担心，下面这些地方一定找得到番剧 🌸
      </p>

      {/* 落地动作：三个快速入口 */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="btn-sakura !py-3 !px-6"
        >
          <Home className="h-4 w-4" />
          回首页
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-white px-6 py-3 font-bold text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-sakura-100"
        >
          <Search className="h-4 w-4" />
          去搜索
        </Link>
        <Link
          href="/category/new-anime"
          className="inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-lavender-100 px-6 py-3 font-bold text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-lavender-300"
        >
          <Compass className="h-4 w-4" />
          逛广场
        </Link>
      </div>
    </div>
  );
}
