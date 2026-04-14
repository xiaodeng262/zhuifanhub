import { HeroBillboard } from "./components/HeroBillboard";
import { ResourceExplorer } from "./components/ResourceExplorer";
import { CategoryRail } from "./components/CategoryRail";
import { listResources } from "@/lib/store/resources";
import { Sparkles } from "lucide-react";

// 强制动态渲染：本页直接 await prisma 查资源，build 容器内无 DB 连接，
// 不加这一行 next build 会试图静态预渲染并因 prisma 连不上而失败
export const dynamic = "force-dynamic";

/*
 * 首页
 * 结构：
 * 1. Hero 泡泡式大栏
 * 2. 资源探索区（client）+ 左侧分类导航（server）
 *
 * 数据来源：server component 直接从 JSON 持久层读取全部资源，
 * 首屏整页 SSR 后 hydrate 给 ResourceExplorer 做客户端筛选。
 * pageSize=0 表示不分页，首页需要一次性拿到全部以支持本地过滤。
 */
export default async function HomePage() {
  const { items } = await listResources({ pageSize: 0 });
  return (
    <>
      <HeroBillboard />

      <section
        id="resources"
        className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10 lg:py-20"
      >
        {/* 小标题栏 */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="marker mb-3">最新一期</p>
            <h2 className="flex flex-wrap items-baseline gap-3 font-pop text-4xl leading-tight text-plum-900 md:text-5xl">
              资源广场
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-plum-900 bg-sakura-300 px-3 py-1 text-sm shadow-pop">
                <Sparkles className="h-3 w-3 fill-plum-900 text-plum-900" />
                リソース広場
              </span>
            </h2>
          </div>
          <p className="max-w-md font-display text-sm leading-relaxed text-plum-700">
            按番名、画质、版本组合筛选 ✨ 点击标签云可以快速圈定你感兴趣的版本。
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <CategoryRail />
          <ResourceExplorer initialResources={items} />
        </div>
      </section>
    </>
  );
}
