import { Megaphone, Sparkles, Pin, Clock } from "lucide-react";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";
import { listNotices } from "@/lib/store/notices";
import type { Notice } from "@/lib/types";

/*
 * 公告页 /notice
 *
 * 业务意图：让访客快速了解站点动态、新功能、活动、维护通知
 * 数据来源：server component 直接从 `lib/store/notices.ts` 读取
 * 首次访问会自动 seed 四条样例公告到 .data/notices.json
 *
 * 排序由 store 内部处理（置顶优先 + 时间倒序），本页只做展示。
 */

type NoticeLevel = Notice["level"];

// 公告分类的可视化样式映射
const LEVEL_STYLE: Record<
  NoticeLevel,
  { label: string; bar: string; chip: string; icon: string }
> = {
  pinned: {
    label: "置顶",
    bar: "bg-sakura-500",
    chip: "bg-sakura-500 text-white",
    icon: "📌",
  },
  feature: {
    label: "新功能",
    bar: "bg-sky2-400",
    chip: "bg-sky2-200 text-sky2-600",
    icon: "✨",
  },
  event: {
    label: "活动",
    bar: "bg-vanilla-500",
    chip: "bg-vanilla-300 text-plum-900",
    icon: "🎀",
  },
  maintenance: {
    label: "维护",
    bar: "bg-lavender-500",
    chip: "bg-lavender-100 text-lavender-700",
    icon: "🛠",
  },
};

export default async function NoticePage() {
  const all = await listNotices();
  const pinned = all.filter((n) => n.level === "pinned");
  const timeline = all.filter((n) => n.level !== "pinned");

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      {/* 顶部标题区 */}
      <div className="mb-12">
        <p className="marker mb-3">Notice Board · 公告栏</p>
        <h1 className="flex flex-wrap items-baseline gap-3 font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          站内公告
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-plum-900 bg-sakura-300 px-3 py-1 text-sm shadow-pop">
            <Megaphone className="h-3 w-3 text-plum-900" />
            お知らせ
          </span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          这里会发布新功能、活动、维护等一切你应该知道的事。置顶公告请优先阅读 🌸
        </p>
      </div>

      {/* 置顶公告：更醒目的卡片样式 */}
      {pinned.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <Pin className="h-4 w-4 text-sakura-600" />
            <span className="marker">Pinned · 置顶</span>
          </div>
          <div className="space-y-5">
            {pinned.map((n) => (
              <NoticeCard key={n.id} notice={n} highlighted />
            ))}
          </div>
        </section>
      )}

      {/* 时间线公告 */}
      {timeline.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-plum-700" />
            <span className="marker">Timeline · 更新时间线</span>
          </div>
          <div className="space-y-5">
            {timeline.map((n) => (
              <NoticeCard key={n.id} notice={n} />
            ))}
          </div>
        </section>
      )}

      {/* 尾部小提示 */}
      <div className="mt-16 rounded-3xl border-[3px] border-plum-900 bg-vanilla-200 p-6 shadow-pop">
        <div className="mb-2 flex items-center gap-2 font-pop text-sm text-plum-900">
          <Sparkles className="h-4 w-4" />
          想第一时间收到公告？
        </div>
        <p className="font-display text-xs leading-relaxed text-plum-900">
          把「追番向导」加入浏览器书签，或关注我们的社区频道，每次重大更新都会同步推送 ✨
        </p>
      </div>
    </div>
  );
}

// 单条公告卡片：左侧色条标识分类，右侧内容主体
function NoticeCard({
  notice,
  highlighted,
}: {
  notice: Notice;
  highlighted?: boolean;
}) {
  const style = LEVEL_STYLE[notice.level];
  return (
    <article
      className={`bubble relative overflow-hidden p-6 pl-8 md:p-8 md:pl-10 ${
        highlighted ? "border-sakura-300 shadow-sakura" : ""
      }`}
    >
      {/* 左侧彩色色条：用绝对定位，避免影响内容排布 */}
      <div
        className={`absolute left-0 top-0 h-full w-2 ${style.bar}`}
        aria-hidden
      />
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full border-2 border-plum-900 px-3 py-1 font-pop text-[11px] ${style.chip}`}
        >
          <span>{style.icon}</span>
          {style.label}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-plum-500">
          {notice.date}
        </span>
      </div>
      <h2 className="mt-3 font-pop text-2xl leading-snug text-plum-900 md:text-3xl">
        {notice.title}
      </h2>
      <p className="mt-3 whitespace-pre-wrap font-display text-sm leading-relaxed text-plum-700 md:text-base">
        {notice.body}
      </p>
    </article>
  );
}
