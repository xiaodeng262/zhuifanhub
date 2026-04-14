import { Search as SearchIcon, Sparkles } from "lucide-react";
import { listResources } from "@/lib/store/resources";
import { ResourceCard } from "@/app/components/ResourceCard";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";

/*
 * 搜索结果页 /search?q=...
 *
 * Server component，直接调 store 的 listResources({ q })
 * 匹配规则在 store 内部统一（title/alias/tags/description 全文 includes）
 *
 * 无 q 或空串：展示提示文案 + 引导用户使用 Header 搜索框
 * 有 q 无结果：展示友好空态
 */

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  // 只有在有查询词时才调用 store；空查询直接显示提示
  const { items } = q
    ? await listResources({ q, pageSize: 0 })
    : { items: [] as Awaited<ReturnType<typeof listResources>>["items"] };

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      <div className="mb-10">
        <p className="marker mb-3">Search · 搜索结果</p>
        <h1 className="flex flex-wrap items-baseline gap-3 font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          {q ? (
            <>
              关于
              <span className="rounded-full border-2 border-plum-900 bg-sakura-300 px-4 py-1 text-3xl shadow-pop md:text-4xl">
                {q}
              </span>
            </>
          ) : (
            <>
              站内搜索
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-plum-900 bg-sakura-300 px-3 py-1 text-sm shadow-pop">
                <SearchIcon className="h-3 w-3 text-plum-900" />
                Keyword
              </span>
            </>
          )}
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          {q
            ? `共找到 ${items.length} 条匹配结果，按发布时间倒序展示`
            : "在顶部搜索框输入关键字后按回车即可，支持番名 / 标签 / 描述全文匹配"}
        </p>
      </div>

      {!q ? (
        // 空查询态：引导用户
        <EmptyPrompt />
      ) : items.length === 0 ? (
        <NoResult q={q} />
      ) : (
        <div className="grid gap-5">
          {items.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyPrompt() {
  return (
    <div className="bubble flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-plum-900 bg-vanilla-200">
        <Sparkles className="h-8 w-8 text-plum-900" />
      </div>
      <p className="font-pop text-2xl text-plum-900">想找什么呢？</p>
      <p className="max-w-sm font-display text-sm text-plum-700">
        试试搜索「芙莉莲」「1080P」「BDRip」这些关键词，或者去广场看看大家最近在分享什么 🌸
      </p>
    </div>
  );
}

function NoResult({ q }: { q: string }) {
  return (
    <div className="bubble flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-plum-900 bg-sakura-200">
        <SearchIcon className="h-8 w-8 text-plum-900" />
      </div>
      <p className="font-pop text-2xl text-plum-900">没有找到「{q}」相关资源</p>
      <p className="max-w-md font-display text-sm text-plum-700">
        可以换个关键词，或者去「求助区」发一帖——很快就会有人来帮你找 ✨
      </p>
    </div>
  );
}
