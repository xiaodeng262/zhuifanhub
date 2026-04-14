import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";

/*
 * 页脚 v2 · 卡通 Pop
 * - 顶部波浪分隔
 * - 粉色软渐变背景
 * - 大号心形 + 「爱你」感叹
 */
export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* 顶部波浪 SVG：用 inline svg 保证完美对齐 */}
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-12 w-full text-sakura-200"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,32L60,37.3C120,43,240,53,360,58.7C480,64,600,64,720,53.3C840,43,960,21,1080,21.3C1200,21,1320,43,1380,53.3L1440,64L1440,80L0,80Z"
        />
      </svg>

      <div className="relative bg-sakura-200/70">
        {/* 背景装饰大号 emoji */}
        <div className="pointer-events-none absolute right-10 top-10 select-none text-[160px] leading-none opacity-10">
          🌸
        </div>
        <div className="pointer-events-none absolute left-10 bottom-10 select-none text-[120px] leading-none opacity-10">
          ✨
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-sakura-500 shadow-pop">
                  <Heart className="h-4 w-4 fill-white text-white" />
                </div>
                <span className="font-pop text-2xl text-plum-900">追番向导</span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-plum-700">
                由粉丝自发维护的动漫资源互助站。我们只做链接的集散地，不托管任何文件。资源不限流，大家一起找 🌸
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-plum-900/20 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sakura-600">
                <Sparkles className="h-3 w-3 fill-vanilla-500 text-vanilla-500" />
                Spring 2026 · Vol.Alpha
              </div>
            </div>

            <FooterCol
              title="站内"
              links={[
                { label: "资源广场", href: "/" },
                { label: "发布资源", href: "/publish" },
                { label: "求助区", href: "/?tab=seek" },
                // "收藏夹" 实际在 /me 页的默认 tab；未登录会被 /me 的鉴权跳 login
                { label: "收藏夹", href: "/me" },
              ]}
            />
            <FooterCol
              title="分类"
              links={[
                { label: "新番资源", href: "/category/new-anime" },
                { label: "经典老番", href: "/category/classic" },
                { label: "剧场版 / OVA", href: "/category/movie" },
                { label: "壁纸原画", href: "/category/artwork" },
              ]}
            />
            <FooterCol
              title="社区"
              links={[
                { label: "公告", href: "/notice" },
                { label: "使用规则", href: "/rules" },
                { label: "失效反馈", href: "/feedback" },
                { label: "联系我们", href: "/contact" },
              ]}
            />
          </div>

          <div className="mt-14 flex flex-col gap-3 border-t-2 border-dashed border-plum-900/20 pt-8 text-xs text-plum-700 md:flex-row md:items-center md:justify-between">
            <span className="font-display font-bold">
              © 2026 追番向导 · Made with{" "}
              <Heart className="inline h-3 w-3 fill-sakura-500 text-sakura-500" /> by 粉丝自发维护
            </span>
            <span className="font-display">
              所有链接来自用户分享 · 网站本身不存储任何资源文件
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// 页脚分组单元
function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="marker mb-4">{title}</div>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="font-display text-sm font-bold text-plum-900 transition-colors hover:text-sakura-600"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
