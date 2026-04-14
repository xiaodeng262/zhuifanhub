import { redirect } from "next/navigation";
import { Heart, Sparkles, UserRound, Bookmark, PenLine, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listResources } from "@/lib/store/resources";
import { listCollectionsByUser } from "@/lib/store/collections";
import { followerCount } from "@/lib/store/follows";
import { listReportsByUser } from "@/lib/store/reports";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";
import { MeTabs } from "./MeTabs";

/*
 * 个人中心 /me
 *
 * Server Component 职责：
 * 1. 鉴权：未登录跳 /login?next=/me
 * 2. 并行查询用户资料 + 我的发布 + 我的收藏 + 粉丝数 + 我的反馈
 * 3. 交给 MeTabs 客户端组件做 tab 切换（收藏 / 发布 / 反馈）
 *
 * 不做成纯客户端拉取的原因：
 * - 进页面第一屏就要有内容，避免 loading 闪烁
 * - SEO（虽然个人中心不开放给蜘蛛，但 SSR 体验更一致）
 */

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");

  const [resourcesResult, collections, fanCount, myReports] = await Promise.all([
    listResources({ authorId: user.id, pageSize: 0 }),
    listCollectionsByUser(user.id),
    followerCount(user.id),
    listReportsByUser(user.id),
  ]);
  const myResources = resourcesResult.items;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      {/* 顶部卡片：头像 + 昵称 + 数据 */}
      <section className="bubble mb-10 flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-plum-900 bg-sakura-300 font-pop text-3xl text-plum-900 shadow-pop">
            {user.username[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h1 className="font-pop text-4xl text-plum-900 md:text-5xl">
                {user.username}
              </h1>
              {user.role === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-plum-900 bg-lavender-300 px-3 py-1 font-pop text-[11px] text-plum-900">
                  <Shield className="h-3 w-3" />
                  管理员
                </span>
              )}
            </div>
            <p className="inline-flex items-center gap-1 font-display text-xs text-plum-500">
              <UserRound className="h-3 w-3" />
              加入于 {user.createdAt.slice(0, 10)}
            </p>
          </div>
        </div>

        {/* 数据格子 */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill
            icon={<PenLine className="h-4 w-4" />}
            label="发布"
            value={myResources.length}
            color="bg-sakura-200"
          />
          <StatPill
            icon={<Bookmark className="h-4 w-4" />}
            label="收藏"
            value={collections.length}
            color="bg-sky2-200"
          />
          <StatPill
            icon={<Heart className="h-4 w-4" />}
            label="粉丝"
            value={fanCount}
            color="bg-vanilla-300"
          />
        </div>
      </section>

      {/* Tab 切换 + 列表（客户端组件） */}
      <MeTabs
        myResources={myResources}
        myCollections={collections}
        myReports={myReports}
      />

      {/* 底部小提示 */}
      <div className="mt-12 rounded-3xl border-[3px] border-plum-900 bg-mint-300 p-5 shadow-pop">
        <div className="mb-2 flex items-center gap-1.5 font-pop text-sm text-plum-900">
          <Sparkles className="h-4 w-4" />
          小贴士
        </div>
        <p className="font-display text-xs leading-relaxed text-plum-900">
          想发一条新资源？点顶部的「发布」按钮即可。发布后可以在这里统一管理 🌸
        </p>
      </div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border-[3px] border-plum-900 px-4 py-3 shadow-pop ${color}`}
    >
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-plum-700">
        {icon}
        {label}
      </span>
      <span className="mt-1 font-pop text-2xl text-plum-900">{value}</span>
    </div>
  );
}
