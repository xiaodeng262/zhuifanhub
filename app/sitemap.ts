import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// 强制动态生成 sitemap：build 容器内无 DB 连接，否则会触发空查询并退化为残缺 sitemap
// 让 sitemap 在每次 GET 请求时实时构造，配合 CDN 缓存即可
export const dynamic = "force-dynamic";

/*
 * sitemap.xml 生成
 *
 * 策略：
 * - 静态页面（首页 / 分类 / 搜索入口 / 公告 / 规则 / 联系）固定写入
 * - 动态页面：拉所有未下架的资源，每条一项 URL
 * - lastModified：资源取 updatedAt；静态页取构建时间
 * - changeFrequency / priority：粗分三档（首页 daily、资源 weekly、辅助页 monthly）
 *
 * 查询限制：
 * - 只取未下架（status != removed）的资源
 * - 理论上可分页输出 sitemap-index，MVP 先一次性返回，超过 5 万条时再拆
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zhuifanhub.com";

// 分类 slug 与 URL 段一一对应
const CATEGORY_SLUGS = [
  "new-anime",
  "classic",
  "movie",
  "artwork",
  "tool",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 静态页面：首页 + 分类 + 搜索/辅助页
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${SITE_URL}/category/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/notice`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/rules`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/feedback`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // 动态资源页：容错处理，DB 不可达时降级为只返回静态部分
  let resourceEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await prisma.resource.findMany({
      where: { status: { not: "removed" } },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    resourceEntries = rows.map((r) => ({
      url: `${SITE_URL}/resource/${r.id}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.warn("[sitemap] failed to query resources, falling back:", err);
  }

  return [...staticEntries, ...resourceEntries];
}
