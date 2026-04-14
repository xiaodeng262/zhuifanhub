import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Download,
  Eye,
  MessageCircle,
  Calendar,
  Heart,
  Sparkles,
} from "lucide-react";
import {
  findResourceById,
  relatedResources,
  incrementResourceStat,
} from "@/lib/store/resources";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isCollected } from "@/lib/store/collections";
import { isFollowing, followerCount } from "@/lib/store/follows";
import { compactNumber, relativeTime } from "@/lib/format";
import { ResourceCard } from "@/app/components/ResourceCard";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";
import { ResourceActions } from "./ResourceActions";
import { CommentSection } from "./CommentSection";
import { FollowAuthorButton } from "./FollowAuthorButton";

// 强制动态渲染：资源详情依赖 [id] 动态段 + 实时统计 + 登录态，禁止 build 阶段预渲染
export const dynamic = "force-dynamic";

/*
 * 资源详情页（Server Component）
 *
 * SSR 职责：
 * 1. 查资源本体、相关资源、作者粉丝数
 * 2. 若当前登录用户存在，预查 isCollected / isFollowingAuthor
 *    让客户端子组件（ResourceActions / FollowAuthorButton）
 *    拿到准确的初始态，无需额外拉取
 * 3. fire-and-forget 触发 views+1（MVP 接受一点不精确）
 *
 * 客户端部分：只有右上角操作按钮、评论区、关注按钮是 client
 * component，其余都由 server 渲染好直接吐 HTML。
 */

/*
 * 动态 metadata
 * 业务意图：
 * - 微信 / Twitter / Telegram 等分享时生成带封面的预览卡片
 * - 标题加番名 alias 增加命中率；描述截取前 120 字
 * - 资源不存在或已下架时返回中性 "资源不存在"，不透露详情
 * 设计约束：
 * - generateMetadata 与页面 render 会各自调一次 findResourceById，
 *   但 Prisma 本身有查询缓存 + Next fetch 层缓存，开销可接受
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resource = await findResourceById(id).catch(() => null);
  if (!resource || resource.status === "removed") {
    return {
      title: "资源不存在",
      robots: { index: false, follow: false },
    };
  }

  // 描述截断：清理换行 + 截前 120 字，避免 OG 卡片过长
  const desc = resource.description
    .replace(/\s+/g, " ")
    .slice(0, 120)
    .trim();
  const fullTitle = resource.alias
    ? `${resource.title} / ${resource.alias}`
    : resource.title;

  return {
    title: fullTitle,
    description: desc || `${resource.title} - 追番向导资源详情`,
    openGraph: {
      type: "article",
      title: fullTitle,
      description: desc,
      images: resource.cover ? [{ url: resource.cover }] : undefined,
      publishedTime: resource.publishedAt,
      modifiedTime: resource.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: resource.cover ? [resource.cover] : undefined,
    },
    alternates: {
      canonical: `/resource/${resource.id}`,
    },
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await findResourceById(id);
  if (!resource || resource.status === "removed") return notFound();

  const related = await relatedResources(id);

  const currentUser = await getCurrentUser();
  const [collected, followingAuthor, fanCount] = await Promise.all([
    currentUser ? isCollected(currentUser.id, id) : Promise.resolve(false),
    currentUser
      ? isFollowing(currentUser.id, resource.authorId)
      : Promise.resolve(false),
    followerCount(resource.authorId),
  ]);

  // views+1 是副作用，失败不阻塞主流程
  incrementResourceStat(id, "views", 1).catch(() => {});

  // 存储类型 → 展示标签
  // 每种类型一套底色，方便用户一眼判断该链接的性质与打开预期
  const storageLabel: Record<string, { label: string; color: string }> = {
    pan: { label: "网盘", color: "bg-sky2-200 text-sky2-600" },
    magnet: { label: "磁力", color: "bg-lavender-300 text-lavender-700" },
    online: { label: "在线看", color: "bg-mint-300 text-mint-500" },
    site: { label: "追番站", color: "bg-sakura-200 text-sakura-700" },
  };

  return (
    <article className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      {/* 右下角浮动返回按钮，滚动中始终可见 */}
      <FloatingBackButton label="返回广场" />

      {/* 标题版块 */}
      <header className="mb-10 grid gap-6 pb-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-[3px] border-plum-900 bg-sakura-300 px-3 py-1 font-pop text-xs text-plum-900 shadow-pop">
              <Sparkles className="h-3 w-3 fill-plum-900" />
              {resource.kind === "seek" ? "求助贴" : "资源分享"}
            </span>
            <span className="marker">No.{resource.id.slice(0, 6)}</span>
          </div>

          <h1 className="font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
            {resource.title}
          </h1>
          {resource.alias && (
            <p className="mt-3 font-display text-xl font-bold text-plum-500">
              {resource.alias}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Meta icon={Calendar} text={relativeTime(resource.publishedAt)} color="sakura" />
            <Meta icon={Eye} text={`${compactNumber(resource.stats.views)} 浏览`} color="sky" />
            <Meta icon={Download} text={`${compactNumber(resource.stats.downloads)} 下载`} color="lavender" />
            <Meta icon={MessageCircle} text={`${resource.stats.comments} 评论`} color="vanilla" />
          </div>
        </div>

        {/*
          右上角操作区：收藏 / 分享 / 失效反馈 / 举报
          - 失效反馈：链接打不开，用户主动告知管理员去修
          - 举报：内容有问题（广告引流、违规、低质），管理员会审核处理
          两者进入不同的后台处理流水，不能混用
        */}
        <ResourceActions
          resourceId={resource.id}
          initialCollected={collected}
        />
      </header>

      {/* 主体双列 */}
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-10">
          {/* 封面 */}
          <div className="relative overflow-hidden rounded-blob border-[3px] border-plum-900 shadow-pop">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resource.cover}
              alt={resource.title}
              className="aspect-[21/9] w-full object-cover"
            />
            {/* 装饰漂浮小星星 */}
            <Sparkles className="absolute right-4 top-4 h-8 w-8 animate-twinkle fill-vanilla-300 text-white" />
          </div>

          {/* 描述 */}
          <section className="bubble p-6">
            <h2 className="marker mb-4">作品简介</h2>
            <p className="whitespace-pre-wrap font-display text-base leading-relaxed text-plum-900">
              {resource.description}
            </p>
          </section>

          {/* 标签 */}
          {resource.tags.length > 0 && (
            <section>
              <h2 className="marker mb-4">版本标签</h2>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((t, i) => (
                  <span
                    key={t}
                    className={`chip ${["chip-pink", "chip-blue", "chip-lavender", "chip-yellow"][i % 4]}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 评论区（客户端组件） */}
          <CommentSection resourceId={resource.id} />
        </div>

        {/* 右侧辅栏 */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {/* 上传者卡片 */}
          <div className="bubble p-6">
            <div className="marker mb-4">Uploaded by</div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-sakura-300 font-pop text-xl text-plum-900 shadow-pop">
                {resource.uploader.name[0]}
              </div>
              <div>
                <p className="font-pop text-lg text-plum-900">
                  {resource.uploader.name}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-display text-xs text-plum-500">
                  <Heart className="h-3 w-3 fill-sakura-500 text-sakura-500" />
                  {fanCount > 0 ? `${fanCount} 位粉丝` : "Lv.8 · 贡献者"}
                </p>
              </div>
            </div>
            <FollowAuthorButton
              authorId={resource.authorId}
              resourceId={resource.id}
              initialFollowing={followingAuthor}
            />
          </div>

          {/* 资源链接 */}
          <div className="bubble p-6">
            <div className="marker mb-4">资源链接</div>
            {resource.links.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-plum-900/20 bg-milk-200 p-4">
                <p className="font-display text-sm text-plum-700">
                  这是一条求助贴，还没有人分享链接。
                </p>
                {resource.bounty ? (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-vanilla-500 bg-vanilla-100 px-3 py-1 font-pop text-xs text-vanilla-700">
                    💰 楼主悬赏 {resource.bounty} 积分
                  </p>
                ) : null}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {resource.links.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-2xl border-[3px] border-plum-900 bg-milk-100 p-4 shadow-pop transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:bg-white hover:shadow-[6px_6px_0_0_#2d1b3d]"
                    >
                      <div>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 font-pop text-[10px] ${storageLabel[l.storage]?.color ?? ""}`}
                        >
                          {storageLabel[l.storage]?.label ?? l.storage}
                        </span>
                        <div className="mt-1.5 font-display text-sm font-bold text-plum-900">
                          {l.label}
                        </div>
                      </div>
                      <span className="font-pop text-xs text-sakura-600 transition-transform group-hover:translate-x-1">
                        前往 →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 rounded-2xl bg-vanilla-100 p-3 font-display text-[11px] leading-relaxed text-plum-700">
              ⚠️ 本站仅收集链接，不存储任何文件。链接打不开请点「失效反馈」；遇到引流、广告、违规内容请点「举报」～
            </p>
          </div>
        </aside>
      </div>

      {/* 相关推荐 */}
      {related.length > 0 && (
        <section className="mt-20">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-pop text-3xl text-plum-900">相关资源</h2>
            <span className="marker">RELATED</span>
          </div>
          <div className="grid gap-5">
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

// 元数据胶囊
function Meta({
  icon: Icon,
  text,
  color,
}: {
  icon: typeof Calendar;
  text: string;
  color: "sakura" | "sky" | "lavender" | "vanilla";
}) {
  const colorMap = {
    sakura: "bg-sakura-100 text-sakura-700 border-sakura-300",
    sky: "bg-sky2-100 text-sky2-600 border-sky2-400",
    lavender: "bg-lavender-100 text-lavender-700 border-lavender-300",
    vanilla: "bg-vanilla-100 text-vanilla-700 border-vanilla-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 ${colorMap[color]} px-3 py-1 font-display text-xs font-bold`}
    >
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}
