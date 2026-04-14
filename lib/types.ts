/*
 * 核心领域模型
 * MVP 阶段数据以 JSON 文件持久化（.data/*.json），
 * 后续接入真实数据库只需替换 lib/store/* 下的 read/write 函数
 */

// 资源分类：对应首页左侧栏目
export type Category =
  | "new-anime" // 新番资源
  | "classic" // 经典老番
  | "movie" // 剧场版 & OVA
  | "artwork" // 壁纸 & 原画
  | "tool"; // 工具 & 软件

// 资源存放方式：影响链接展示样式与用户预期
// - magnet 磁力/BT 种子
// - pan    网盘（百度/阿里/115）
// - online 直接能在浏览器内播放的视频地址
// - site   追番 / 资源索引站：Bangumi、动漫花园、Nyaa 等
export type ResourceStorage = "magnet" | "pan" | "online" | "site";

// 资源类型：帮助列表页区分「分享」与「求助」
export type PostKind = "share" | "seek";

export interface ResourceLink {
  label: string; // 显示名：如「百度网盘 | 提取码: a1b2」
  url: string; // 真实外链
  storage: ResourceStorage;
}

export interface Resource {
  id: string;
  title: string; // 主标题：通常等于番名
  alias?: string; // 副标题：日文原名或译名
  cover: string; // 封面图 URL
  category: Category;
  kind: PostKind;
  tags: string[]; // 画质/字幕/版本标签
  description: string; // 简介
  uploader: {
    name: string;
    avatar?: string;
  };
  publishedAt: string; // ISO 时间，用于前端本地化展示
  stats: {
    views: number;
    downloads: number;
    comments: number;
  };
  links: ResourceLink[];
  year?: number;
  // 求助贴时可选的悬赏积分
  bounty?: number;

  /*
   * 关联发布者的 user.id
   * 种子数据填 "seed"，真实发布时由后端从 getCurrentUser() 注入
   * 用于「我的发布」「关注作者」「只有作者或管理员可删除」等鉴权场景
   */
  authorId: string;
  // 软删除：被举报处理后可置为 removed，列表页过滤掉
  status?: "published" | "removed";
  updatedAt?: string;
}

export interface CategoryMeta {
  key: Category;
  name: string;
  kana: string; // 装饰用日文假名
  description: string;
}

/*
 * 评论
 * - authorName 冗余存一份，避免每次列表都要 join 用户表
 * - 为未来二级回复预留 parentId 字段；MVP 只渲染一级
 */
export interface Comment {
  id: string;
  resourceId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  parentId?: string;
}

/*
 * 收藏关系：扁平表，(userId, resourceId) 组合唯一
 * 由 store 函数在写入前检查去重
 */
export interface Collection {
  userId: string;
  resourceId: string;
  createdAt: string;
}

/*
 * 关注关系：follower 关注 followee
 * 业务层保证 follower !== followee
 */
export interface Follow {
  followerId: string;
  followeeId: string;
  createdAt: string;
}

/*
 * 站点公告
 * level 决定左侧彩色条颜色 + 排序权重（pinned 置顶）
 */
export interface Notice {
  id: string;
  level: "pinned" | "feature" | "event" | "maintenance";
  title: string;
  body: string;
  date: string; // 展示给用户看的日期（如 2026.04.10）
  createdAt: string; // 内部排序用的 ISO 时间
}
