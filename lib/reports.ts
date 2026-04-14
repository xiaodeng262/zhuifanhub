/*
 * 举报 / 反馈类型与静态 label
 *
 * Step 6 之后：
 * - 实际数据读写由 `lib/store/reports.ts` 负责（JSON 文件持久化）
 * - 本文件保留：类型定义、静态 label 映射、首次 seed 用的 SEED_REPORTS
 *
 * 两类业务流：
 * - content: 内容举报（广告引流、低质、违规、重复贴）
 * - dead:    失效反馈（链接打不开 / 失效）
 * 两者合并到同一张表，用 kind 区分，避免写两份相同代码
 */

export type ReportKind = "content" | "dead";

// 内容举报可选原因枚举
export type ContentReason =
  | "ad" // 广告 / 引流
  | "spam" // 灌水 / 低质
  | "duplicate" // 重复贴
  | "illegal" // 违规 / 侵权
  | "other"; // 其他

export const CONTENT_REASON_LABEL: Record<ContentReason, string> = {
  ad: "广告 / 引流",
  spam: "灌水 / 低质",
  duplicate: "重复贴",
  illegal: "违规 / 侵权",
  other: "其他",
};

// 处理状态：新 → 处理中 → 已处理 / 驳回
export type ReportStatus = "pending" | "processing" | "resolved" | "rejected";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已处理",
  rejected: "已驳回",
};

export interface ReportRecord {
  id: string;
  kind: ReportKind;
  // 被举报的资源
  resourceId: string;
  resourceTitle: string;
  // 举报人（用户名，冗余存储便于直接渲染）
  reporter: string;
  // 举报人 user.id；种子数据填 "seed"
  // 用于未来「我提交的举报」查询 + 防止重复举报
  reporterId: string;
  // 举报时间
  createdAt: string;
  status: ReportStatus;
  // 内容举报才有 reason；失效反馈可以为空
  reason?: ContentReason;
  // 用户自填的备注
  note?: string;
}

/*
 * 种子数据
 *
 * 仅作为 lib/store/reports.ts 首次 seed 的数据源。
 * reporterId: "seed" 标记为非真实用户，后台 UI 可按需过滤。
 */
export const SEED_REPORTS: ReportRecord[] = [
  {
    id: "r-20260413-001",
    kind: "content",
    resourceId: "spy-family-s3",
    resourceTitle: "间谍过家家 第三季",
    reporter: "路过的咸鱼",
    reporterId: "seed",
    createdAt: "2026-04-13T09:12:00Z",
    status: "pending",
    reason: "ad",
    note: "评论区出现了私人群引流二维码",
  },
  {
    id: "r-20260413-002",
    kind: "content",
    resourceId: "jojo-wallpaper-pack",
    resourceTitle: "JOJO 第六部 高清壁纸集",
    reporter: "深夜补番人",
    reporterId: "seed",
    createdAt: "2026-04-13T08:20:00Z",
    status: "processing",
    reason: "duplicate",
    note: "和昨天那条是同一份资源，标题改了",
  },
  {
    id: "r-20260412-003",
    kind: "content",
    resourceId: "mygo-tracker",
    resourceTitle: "BanG Dream! It's MyGO!!!!!",
    reporter: "字幕鉴赏家",
    reporterId: "seed",
    createdAt: "2026-04-12T22:05:00Z",
    status: "resolved",
    reason: "spam",
    note: "内容太少，基本就是放了几个链接",
  },
  {
    id: "r-20260411-004",
    kind: "content",
    resourceId: "frieren-s1-bdrip",
    resourceTitle: "葬送的芙莉莲",
    reporter: "月见草",
    reporterId: "seed",
    createdAt: "2026-04-11T16:40:00Z",
    status: "rejected",
    reason: "illegal",
    note: "以为是盗版，其实是字幕组正常发布",
  },
  {
    id: "r-20260413-005",
    kind: "dead",
    resourceId: "evangelion-remake",
    resourceTitle: "新世纪福音战士 新剧场版",
    reporter: "原盘老粉",
    reporterId: "seed",
    createdAt: "2026-04-13T10:30:00Z",
    status: "pending",
    note: "115 网盘链接打不开了，提示分享已失效",
  },
  {
    id: "r-20260412-006",
    kind: "dead",
    resourceId: "mushishi-full",
    resourceTitle: "虫师 全集",
    reporter: "萤火虫",
    reporterId: "seed",
    createdAt: "2026-04-12T14:15:00Z",
    status: "processing",
    note: "百度网盘被吞了一部分文件，求补档",
  },
  {
    id: "r-20260411-007",
    kind: "dead",
    resourceId: "mygo-tracker",
    resourceTitle: "BanG Dream! It's MyGO!!!!!",
    reporter: "春日电波台",
    reporterId: "seed",
    createdAt: "2026-04-11T11:00:00Z",
    status: "resolved",
    note: "mikan RSS 地址已迁移，已在评论区更新",
  },
];
