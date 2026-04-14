import Link from "next/link";
import { MessageCircle, Download, Eye, HelpCircle, Heart } from "lucide-react";
import type { Resource } from "@/lib/types";
import { compactNumber, relativeTime } from "@/lib/format";

/*
 * 资源卡片 v2 · 卡通 Pop
 * 设计意图：
 * - 整卡圆角气泡 + 黑描边 + 粉色阴影
 * - hover 时整卡上浮 + 阴影加深
 * - 求助贴用薄荷绿 + HelpCircle 区分
 * - 标签芯片按位置循环取四色
 */
export function ResourceCard({ resource }: { resource: Resource }) {
  const isSeek = resource.kind === "seek";
  // 标签颜色循环：让列表不单调
  const chipColors = ["chip-pink", "chip-blue", "chip-lavender", "chip-yellow"];

  return (
    <Link
      href={`/resource/${resource.id}`}
      className="group relative block bubble bubble-hover overflow-hidden"
    >
      <article className="flex flex-col gap-5 p-5 md:flex-row md:p-6">
        {/* 封面：圆角内嵌框 */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl border-[3px] border-plum-900 md:aspect-[3/4] md:w-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resource.cover}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* 类型角标 */}
          <div className="absolute left-2 top-2">
            {isSeek ? (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-plum-900 bg-mint-300 px-2 py-0.5 font-pop text-[10px] text-plum-900">
                <HelpCircle className="h-3 w-3" />
                求助
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-plum-900 bg-sakura-300 px-2 py-0.5 font-pop text-[10px] text-plum-900">
                ✦ 分享
              </span>
            )}
          </div>

          {/* 年份角标 */}
          {resource.year && (
            <div className="absolute bottom-2 right-2 rounded-full border-2 border-plum-900 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-plum-900">
              {resource.year}
            </div>
          )}
        </div>

        {/* 内容区 */}
        <div className="flex flex-1 flex-col">
          {/* 顶部元信息行 */}
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-plum-500">
            <span>#{resource.id.slice(0, 8)}</span>
            <span>{relativeTime(resource.publishedAt)}</span>
          </div>

          {/* 主标题 */}
          <h3 className="font-pop text-2xl leading-tight text-plum-900 transition-colors group-hover:text-sakura-600">
            {resource.title}
          </h3>
          {resource.alias && (
            <p className="mt-1 font-display text-sm font-bold text-plum-500">
              {resource.alias}
            </p>
          )}

          {/* 描述 */}
          <p className="mt-3 line-clamp-2 font-display text-sm leading-relaxed text-plum-700">
            {resource.description}
          </p>

          {/* 标签芯片：多色轮询 */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 5).map((tag, i) => (
              <span key={tag} className={`chip ${chipColors[i % chipColors.length]}`}>
                {tag}
              </span>
            ))}
          </div>

          {/* 底部栏：上传者 + 统计 */}
          <div className="mt-auto flex items-center justify-between pt-5 font-mono text-[11px] text-plum-700">
            <span className="flex items-center gap-1.5 truncate">
              <Heart className="h-3 w-3 fill-sakura-500 text-sakura-500" />
              <span className="font-display font-bold text-plum-900">
                {resource.uploader.name}
              </span>
            </span>
            <div className="flex items-center gap-3">
              {resource.bounty ? (
                <span className="rounded-full border-2 border-vanilla-500 bg-vanilla-100 px-2 py-0.5 font-pop text-[10px] text-vanilla-700">
                  赏 {resource.bounty}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-sky2-500" />
                {compactNumber(resource.stats.views)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3 text-lavender-500" />
                {compactNumber(resource.stats.downloads)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-sakura-500" />
                {resource.stats.comments}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
