import Link from "next/link";
import { ArrowRight, PenLine, Search, Sparkles, Star, Heart } from "lucide-react";

/*
 * 首页 Hero v2 · 卡通 Pop
 * 版式意图：
 * - 左：大号 Mochiy Pop 标题（带弹跳感） + 彩色贴纸按钮
 * - 右：推荐卡片倾斜摆放，像海报贴在墙上
 * - 四角装饰：星星、爱心、花朵，慢速漂浮
 */
export function HeroBillboard() {
  return (
    <section className="relative overflow-hidden">
      {/* 背景漂浮装饰：用绝对定位摆星星、花、爱心 */}
      <FloatingDeco />

      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-6 py-16 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
        {/* 左列：文字 */}
        <div className="animate-bounce-in">
          {/* 顶部贴纸：新番上线 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-vanilla-300 px-4 py-1.5 shadow-pop">
            <Sparkles className="h-3.5 w-3.5 fill-plum-900 text-plum-900" />
            <span className="font-pop text-xs text-plum-900">春季新番 · 持续更新中</span>
          </div>

          {/* Slogan：巨型泡泡字 */}
          <h1 className="font-pop text-[clamp(2.8rem,6.5vw,5.5rem)] leading-[1.1] text-plum-900">
            资源不限流，
            <br />
            大家一起
            <span className="relative ml-2 inline-block">
              {/* 手绘高亮块 */}
              <span className="absolute inset-x-0 bottom-2 -z-10 h-[40%] -skew-y-1 rounded-lg bg-sakura-300" />
              <span className="relative text-sakura-600">找！</span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl font-display text-base leading-relaxed text-plum-700 md:text-lg">
            由粉丝自发维护的动漫资源互助站 🌸
            <br className="hidden md:block" />
            把散落在各处的番剧链接、壁纸、工具，集中到一个地方。
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/publish" className="btn-sakura">
              <PenLine className="h-4 w-4" />
              发布 / 求助
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#resources" className="btn-outline">
              <Search className="h-4 w-4" />
              逛逛资源
            </Link>
          </div>

          {/* 三栏关键数据：圆角卡片 */}
          <dl className="mt-14 grid grid-cols-3 gap-4 md:gap-6">
            <Stat label="收录资源" value="2,486" color="pink" />
            <Stat label="活跃粉丝" value="13.4k" color="blue" />
            <Stat label="本周新增" value="218" color="yellow" />
          </dl>
        </div>

        {/* 右列：推荐卡片 */}
        <aside className="relative animate-bounce-in [animation-delay:200ms]">
          {/* 背层偏移彩块：形成层次 */}
          <div className="absolute inset-0 translate-x-4 translate-y-4 rotate-2 rounded-blob border-[3px] border-plum-900 bg-sky2-200" />
          <div className="absolute inset-0 translate-x-2 translate-y-2 rotate-1 rounded-blob border-[3px] border-plum-900 bg-lavender-300" />

          {/* 主卡片：向左轻微倾斜 */}
          <div className="relative -rotate-1 overflow-hidden rounded-blob border-[3px] border-plum-900 bg-white shadow-pop">
            {/* 顶部贴纸：本期推荐 */}
            <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border-2 border-plum-900 bg-vanilla-300 px-3 py-1 font-pop text-xs text-plum-900">
              <Star className="h-3 w-3 fill-plum-900" />
              本期推荐
            </div>

            {/* 右上角爱心 */}
            <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-plum-900 bg-white">
              <Heart className="h-4 w-4 fill-sakura-500 text-sakura-500" />
            </div>

            {/* 封面 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80"
              alt="当期推荐"
              className="aspect-[4/5] w-full object-cover"
            />

            {/* 下方信息条 */}
            <div className="border-t-[3px] border-plum-900 bg-sakura-100 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sakura-700">
                NEW · 葬送的芙莉莲
              </p>
              <h3 className="mt-2 font-pop text-2xl leading-tight text-plum-900">
                葬送のフリーレン
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["BDRip", "1080P", "双语"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border-2 border-plum-900 bg-white px-2.5 py-0.5 font-display text-[10px] font-bold text-plum-900"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 漂浮装饰：星星 */}
          <Sparkles className="absolute -right-6 -top-6 h-10 w-10 animate-twinkle fill-vanilla-300 text-vanilla-500" />
          <Star className="absolute -bottom-4 -left-4 h-8 w-8 animate-float fill-sakura-300 text-sakura-500" />
        </aside>
      </div>
    </section>
  );
}

// 统计数据卡片：三色变体
function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "pink" | "blue" | "yellow";
}) {
  const colorMap = {
    pink: "bg-sakura-100 border-sakura-400",
    blue: "bg-sky2-100 border-sky2-400",
    yellow: "bg-vanilla-100 border-vanilla-500",
  };
  return (
    <div
      className={`rounded-3xl border-[3px] border-plum-900 ${colorMap[color]} p-4 shadow-pop`}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-plum-700">
        {label}
      </div>
      <div className="mt-1 font-pop text-2xl text-plum-900 md:text-3xl">{value}</div>
    </div>
  );
}

// 背景漂浮装饰组件
function FloatingDeco() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* 左上花朵 */}
      <div className="absolute left-[8%] top-[12%] animate-float text-5xl">🌸</div>
      {/* 右上星星 */}
      <div className="absolute right-[10%] top-[8%] animate-twinkle text-4xl">
        ✨
      </div>
      {/* 左下爱心 */}
      <div className="absolute left-[15%] bottom-[10%] animate-float text-3xl [animation-delay:1s]">
        💕
      </div>
      {/* 右下装饰星 */}
      <div className="absolute right-[5%] bottom-[15%] animate-twinkle text-4xl [animation-delay:0.5s]">
        ⭐
      </div>
      {/* 中间漂浮小点 */}
      <div className="absolute left-[45%] top-[20%] animate-float text-2xl [animation-delay:1.5s]">
        ☁️
      </div>
    </div>
  );
}
