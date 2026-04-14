import Link from "next/link";
import { PenLine, Sparkles, Heart } from "lucide-react";
import { AuthMenu } from "./AuthMenu";
import { HeaderSearch } from "./HeaderSearch";
import { NotificationBell } from "./NotificationBell";

/*
 * 站点顶部导航 v2 · 卡通 Pop
 * 设计意图：
 * - 糖果贴纸风格：圆角胶囊导航、粉色 Logo 心形
 * - Logo 中文大字 + 日文副标，下方漂浮小装饰
 * - 按钮全部使用 3px 黑描边 + pop shadow
 */
export function SiteHeader() {
  const navItems = [
    { href: "/", label: "首页", emoji: "🏠" },
    { href: "/category/new-anime", label: "新番", emoji: "✨" },
    { href: "/category/classic", label: "经典", emoji: "🌸" },
    { href: "/category/movie", label: "剧场版", emoji: "🎬" },
    { href: "/category/artwork", label: "壁纸", emoji: "🎨" },
    { href: "/category/tool", label: "工具", emoji: "🛠" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-plum-900/10 bg-milk-100/85 backdrop-blur-xl">
      {/* 容器：max-w 略放宽到 1500，所有子项 shrink-0 防止登录后右侧元素挤压主导航 */}
      <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-6 py-4 lg:px-8">
        {/* Logo：shrink-0 锁定宽度，永不被压缩 */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          {/* 心形 Logo 图标 */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-sakura-500 shadow-pop transition-transform group-hover:-rotate-6">
            <Heart className="h-5 w-5 fill-white text-white" />
            {/* 右上角闪星 */}
            <Sparkles className="absolute -right-1.5 -top-1.5 h-4 w-4 fill-vanilla-500 text-vanilla-500" />
          </div>

          <div className="flex flex-col">
            <span className="whitespace-nowrap font-pop text-xl leading-none text-plum-900">
              追番向导
            </span>
            <span className="mt-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.25em] text-sakura-600">
              ZHUI·FAN·GUIDE
            </span>
          </div>
        </Link>

        {/* 主导航：胶囊式
         * shrink-0 + whitespace-nowrap 双保险：
         * - shrink-0 防止整组在右侧元素增加时被压窄
         * - whitespace-nowrap 防止 CJK 字符按字符断行（首/页 竖排）
         */}
        <nav className="ml-2 hidden shrink-0 items-center gap-0.5 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-transparent px-3 py-2 font-display text-sm font-bold text-plum-700 transition-all hover:border-plum-900 hover:bg-sakura-100 hover:text-sakura-700"
            >
              <span className="text-xs transition-transform group-hover:scale-125">
                {item.emoji}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右侧操作区：shrink-0 锁宽，gap-2 比原来更紧凑 */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* 搜索条：胶囊（client 组件，Enter 跳 /search） */}
          <HeaderSearch />

          <Link
            href="/publish"
            className="btn-sakura shrink-0 whitespace-nowrap !px-4 !py-2 text-sm"
          >
            <PenLine className="h-4 w-4" />
            发布
          </Link>
          {/* 通知铃铛：仅登录时自渲染，未登录时返回 null，不占布局 */}
          <NotificationBell />
          {/* 登录态入口：客户端组件，按真实 /api/auth/me 返回渲染 */}
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
