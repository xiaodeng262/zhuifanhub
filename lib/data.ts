import type { CategoryMeta, Resource } from "./types";

/*
 * 静态元数据
 *
 * 本文件曾经存放整个网站的 mock 资源列表，Step 1 之后资源已迁移到
 * `lib/store/resources.ts`（JSON 文件持久化）。本文件保留两类**不会
 * 写入数据库**的静态常量：
 * - CATEGORIES: 分类元数据（首页左栏、分类路由、tooltip 副标题）
 * - HOT_TAGS:   热门标签云（首页展示，真正的标签从资源表派生）
 * 以及一份仅被 store 引用的 RESOURCES_SEED 种子数组——作为首次 seed
 * 的唯一真源。Step 3 完成页面迁移后会彻底移除旧的 findResource /
 * relatedResources 临时 re-export。
 */

// 分类元数据
// - name: 中文展示名
// - kana: 对应日文/假名，供版式装饰使用
// - description: 次行副标，出现在分类栏目与导航 tooltip
export const CATEGORIES: CategoryMeta[] = [
  {
    key: "new-anime",
    name: "新番资源",
    kana: "新作アニメ",
    description: "本季度更新的正在播送作品",
  },
  {
    key: "classic",
    name: "经典老番",
    kana: "名作アーカイブ",
    description: "值得反复回看的老作品合集",
  },
  {
    key: "movie",
    name: "剧场版 / OVA",
    kana: "劇場版・OVA",
    description: "剧场版、OVA 与特典映像",
  },
  {
    key: "artwork",
    name: "壁纸 / 原画",
    kana: "イラスト集",
    description: "高清壁纸、原画与艺术设定",
  },
  {
    key: "tool",
    name: "工具 / 软件",
    kana: "ツール",
    description: "播放器、下载器与周边软件",
  },
];

// 热门标签云
// 实际接入后应由服务端按使用频率自动生成
export const HOT_TAGS = [
  "1080P",
  "4K",
  "BDRip",
  "简中",
  "繁中",
  "无删减",
  "内封字幕",
  "合集",
  "生肉",
  "熟肉",
  "网飞版",
  "台配",
  "原盘",
  "HEVC",
  "修复版",
  "10-bit",
  "双语",
  "补档",
];

/*
 * 资源种子数组
 *
 * 仅作为 `lib/store/resources.ts` 首次 seed 的数据源。
 * `authorId: "seed"` 用来标记「非真实用户发布」，在删除/鉴权分支里
 * 会被当作无作者处理（任何登录用户都不会匹配到）。
 *
 * 为什么放在这里而不是 store 内部：
 * - 与 CATEGORIES / HOT_TAGS 一起代表"开发期默认内容"，语义一致
 * - store 文件保持纯逻辑，不混杂 200 行字面量
 */
export const RESOURCES_SEED: Resource[] = [
  {
    id: "frieren-s1-bdrip",
    title: "葬送的芙莉莲",
    alias: "葬送のフリーレン",
    cover:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    category: "new-anime",
    kind: "share",
    tags: ["BDRip", "1080P", "简中", "内封字幕", "合集"],
    description:
      "BD 修正版合集，28 话全。内封简繁字幕，音轨保留日配原声。画质参数 x265 10-bit，体积友好下载迅速。",
    uploader: { name: "月之卷" },
    publishedAt: "2026-04-10T10:00:00Z",
    stats: { views: 12834, downloads: 5421, comments: 86 },
    links: [
      { label: "阿里云盘 · 提取码 mira", url: "#", storage: "pan" },
      { label: "磁力链接 · 22.4GB", url: "#", storage: "magnet" },
      { label: "动漫花园 · 完整索引", url: "#", storage: "site" },
    ],
    year: 2023,
    authorId: "seed",
    status: "published",
  },
  {
    id: "spy-family-s3",
    title: "间谍过家家 第三季",
    alias: "SPY×FAMILY SEASON 3",
    cover:
      "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1200&q=80",
    category: "new-anime",
    kind: "share",
    tags: ["WEBRip", "1080P", "内嵌繁中", "当季追番"],
    description:
      "本季度更新中，每周同步更新至最新。提供 WEBRip 版本与繁中内嵌字幕，适合边更边追。",
    uploader: { name: "深夜番组台" },
    publishedAt: "2026-04-11T14:30:00Z",
    stats: { views: 8421, downloads: 2890, comments: 142 },
    links: [{ label: "在线播放", url: "#", storage: "online" }],
    year: 2026,
    authorId: "seed",
    status: "published",
  },
  {
    id: "evangelion-remake",
    title: "新世纪福音战士 新剧场版",
    alias: "エヴァンゲリオン新劇場版",
    cover:
      "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1200&q=80",
    category: "movie",
    kind: "share",
    tags: ["4K", "HDR", "BDMV", "原盘"],
    description:
      "新剧场版四部曲原盘合集：序・破・Q・终。含日版 BDMV 与所有花絮，适合收藏党。",
    uploader: { name: "原盘档案馆" },
    publishedAt: "2026-04-05T08:00:00Z",
    stats: { views: 9980, downloads: 3211, comments: 54 },
    links: [
      { label: "115 网盘", url: "#", storage: "pan" },
      { label: "磁力 · 86.3GB", url: "#", storage: "magnet" },
    ],
    year: 2021,
    authorId: "seed",
    status: "published",
  },
  {
    id: "mushishi-full",
    title: "虫师 全集",
    alias: "蟲師",
    cover:
      "https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&w=1200&q=80",
    category: "classic",
    kind: "share",
    tags: ["BDRip", "1080P", "简繁双语", "修复版"],
    description:
      "含续章与特别篇，简繁双语字幕版本。有位老朋友重新制作的修复字幕，推荐夜里一个人看。",
    uploader: { name: "萤火虫书房" },
    publishedAt: "2026-03-28T22:10:00Z",
    stats: { views: 6310, downloads: 1877, comments: 38 },
    links: [{ label: "百度网盘", url: "#", storage: "pan" }],
    year: 2005,
    authorId: "seed",
    status: "published",
  },
  {
    id: "seek-kaiba-td",
    title: "求 · 千年女优 4K 修复版",
    alias: "千年女優 4K Remaster",
    cover:
      "https://images.unsplash.com/photo-1551913902-c92207136625?auto=format&fit=crop&w=1200&q=80",
    category: "movie",
    kind: "seek",
    tags: ["4K", "日配", "无字幕也行"],
    description:
      "今敏导演经典。想找海外发行的 4K 修复版，市面上能见到的版本都是 1080P 升的。谁有原盘求分享。",
    uploader: { name: "今敏粉" },
    publishedAt: "2026-04-12T09:40:00Z",
    stats: { views: 1421, downloads: 0, comments: 27 },
    links: [],
    bounty: 300,
    authorId: "seed",
    status: "published",
  },
  {
    id: "jojo-wallpaper-pack",
    title: "JOJO 第六部 高清壁纸集",
    alias: "Stone Ocean Wallpapers",
    cover:
      "https://images.unsplash.com/photo-1612036782180-6f0822045d23?auto=format&fit=crop&w=1200&q=80",
    category: "artwork",
    kind: "share",
    tags: ["4K", "壁纸", "手机版", "PC版"],
    description:
      "含 4K 桌面 + 竖屏手机版本，共 142 张。来自 official art book 扫描与部分同人二创。",
    uploader: { name: "spin_art" },
    publishedAt: "2026-04-08T20:00:00Z",
    stats: { views: 3221, downloads: 1102, comments: 14 },
    links: [{ label: "阿里云盘", url: "#", storage: "pan" }],
    authorId: "seed",
    status: "published",
  },
  {
    id: "aegisub-mac",
    title: "PotPlayer 魔改版 · 动漫调教",
    alias: "PotPlayer for Anime",
    cover:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    category: "tool",
    kind: "share",
    tags: ["播放器", "动漫调教", "绿色版"],
    description:
      "为追番特别调校的 PotPlayer 配置，内置 madVR + SVP 补帧参数，支持常见动漫字幕格式。",
    uploader: { name: "午夜播放器" },
    publishedAt: "2026-03-15T11:45:00Z",
    stats: { views: 2103, downloads: 867, comments: 9 },
    links: [{ label: "GitHub Release", url: "#", storage: "pan" }],
    authorId: "seed",
    status: "published",
  },
  {
    id: "mygo-tracker",
    title: "BanG Dream! It's MyGO!!!!!",
    alias: "ぼっち・ざ・ろっく × MyGO 追番指南",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    category: "new-anime",
    kind: "share",
    tags: ["当季追番", "在线看", "追番站", "生肉"],
    description:
      "整理了几个能追到 MyGO 全集的追番站，包含字幕进度、更新提醒和在线播放入口，比到处翻群里转发更省心。",
    uploader: { name: "春日电波台" },
    publishedAt: "2026-04-12T20:15:00Z",
    stats: { views: 4521, downloads: 0, comments: 63 },
    links: [
      { label: "Bangumi · 番组放送页", url: "#", storage: "site" },
      { label: "樱花动漫 · 在线播放", url: "#", storage: "site" },
      { label: "mikan · RSS 订阅", url: "#", storage: "site" },
    ],
    year: 2026,
    authorId: "seed",
    status: "published",
  },
  {
    id: "makoto-shinkai-pack",
    title: "新海诚作品壁纸合集",
    alias: "新海誠 高解像度 Wallpaper",
    cover:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80",
    category: "artwork",
    kind: "share",
    tags: ["4K", "8K", "合集", "壁纸"],
    description:
      "收录《你的名字》《天气之子》《铃芽之旅》等官方壁纸与宣传插画，共 86 张。",
    uploader: { name: "星辰收藏家" },
    publishedAt: "2026-04-03T16:20:00Z",
    stats: { views: 5812, downloads: 2341, comments: 31 },
    links: [{ label: "阿里云盘", url: "#", storage: "pan" }],
    authorId: "seed",
    status: "published",
  },
];

/*
 * 旧版查询函数（同步）——Step 3 之前的页面仍在使用
 *
 * Step 3 会把所有调用处替换为 lib/store/resources.ts 的 async 版本，
 * 届时本节将被删除。此处保留仅为让 Step 1/2 期间项目仍能 build。
 */
export function findResource(id: string): Resource | undefined {
  return RESOURCES_SEED.find((r) => r.id === id);
}

export function relatedResources(id: string): Resource[] {
  const self = findResource(id);
  if (!self) return [];
  return RESOURCES_SEED.filter(
    (r) => r.id !== id && r.category === self.category
  ).slice(0, 3);
}

// 旧名称兼容：部分页面直接 import { RESOURCES }
// Step 3 会彻底删除
export const RESOURCES = RESOURCES_SEED;
