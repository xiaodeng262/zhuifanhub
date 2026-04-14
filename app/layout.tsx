import type { Metadata } from "next";
import { Mochiy_Pop_One, Zen_Maru_Gothic, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { AuthProvider } from "./components/AuthProvider";

/*
 * 字体策略 v2 · 卡通 Pop
 * - Mochiy Pop One: 棉花糖般的泡泡日文字体，承担 Hero 与大标题
 * - Zen Maru Gothic: 日系圆体，正文与小标题，可爱但保持可读性
 * - JetBrains Mono: 等宽，编号与元数据
 * 全部通过 CSS 变量暴露给 Tailwind fontFamily
 */
const pop = Mochiy_Pop_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pop",
  display: "swap",
});

const display = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

/*
 * 站点级 metadata
 * - metadataBase：必须是绝对 URL，所有 OG image / alternates / icons 的相对路径会基于它拼接
 *   通过 NEXT_PUBLIC_SITE_URL 注入，默认指向生产域名
 * - title.template：子页面只需要提供简短标题，自动拼 " · 追番向导" 后缀
 * - openGraph / twitter：分享到微信/Twitter 时的预览卡片
 * - icons：复用 app/icon.svg 与 app/apple-icon.svg（Next 约定文件）
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zhuifanhub.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "追番向导 · 资源不限流，大家一起找",
    template: "%s · 追番向导",
  },
  description:
    "由粉丝自发维护的动漫资源互助站。分享与求助番剧链接、壁纸、工具，不限流、不审核、聚在一起更自由。",
  keywords: [
    "追番",
    "动漫资源",
    "番剧下载",
    "新番",
    "经典动漫",
    "剧场版",
    "二次元壁纸",
  ],
  applicationName: "追番向导",
  authors: [{ name: "追番向导社区" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "追番向导",
    title: "追番向导 · 资源不限流，大家一起找",
    description:
      "由粉丝自发维护的动漫资源互助站。分享与求助番剧链接、壁纸、工具，不限流、不审核、聚在一起更自由。",
  },
  twitter: {
    card: "summary_large_image",
    title: "追番向导 · 资源不限流，大家一起找",
    description:
      "由粉丝自发维护的动漫资源互助站，分享与求助番剧链接、壁纸、工具。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    email: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${pop.variable} ${display.variable} ${mono.variable}`}>
      <body>
        {/* AuthProvider 包住整站，Header/登录页等共享同一份登录态 */}
        <AuthProvider>
          <div className="stack flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
