import type { MetadataRoute } from "next";

/*
 * robots.txt 生成
 *
 * 策略：
 * - 允许所有爬虫抓取公开内容
 * - 屏蔽 /api 与 /admin 以及登录态相关路径，避免被索引出无效/私密页面
 * - sitemap 指向 /sitemap.xml（由 app/sitemap.ts 生成）
 *
 * 通过 NEXT_PUBLIC_SITE_URL 注入站点绝对地址，便于多环境部署
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zhuifanhub.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/me/", "/login", "/publish"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
