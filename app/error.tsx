"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle, Sparkles } from "lucide-react";

/*
 * 全局运行时错误页 /error.tsx
 *
 * 业务意图：
 * - 任意未捕获的异常冒泡到根 Error Boundary 时承接，避免白屏
 * - 给出重试 / 回首页两个明确出口
 *
 * 关键约束：
 * - Next.js 约定必须是 Client Component（"use client"），接收 { error, reset }
 *   reset() 会让 Next 重新渲染当前出错的分段
 * - 不要把 error.message 直接展示给用户：服务端报错可能含堆栈或内部路径
 *   只在 console 输出一次用于开发排查；线上可以在 useEffect 里接入 Sentry 之类的 reporter
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 开发者可在 devtools 看到；生产侧建议在此接入上报
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-[900px] flex-col items-center justify-center px-6 py-20 text-center">
      <Sparkles className="absolute left-12 top-16 h-5 w-5 animate-twinkle fill-vanilla-500 text-vanilla-500" />
      <Sparkles className="absolute right-20 top-28 h-6 w-6 animate-twinkle fill-sakura-500 text-sakura-500" />

      {/* 警告图标：用圆角方底 + 粗描边，与 Logo 风格一致 */}
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-[3px] border-plum-900 bg-vanilla-300 shadow-pop">
        <AlertTriangle className="h-12 w-12 text-plum-900" />
      </div>

      <p className="marker mt-6">Something went wrong · 出错啦</p>
      <h1 className="mt-3 font-pop text-4xl text-plum-900 md:text-5xl">
        页面闹脾气了…
      </h1>
      <p className="mt-4 max-w-md font-display text-sm leading-relaxed text-plum-700 md:text-base">
        我们已经记录下这个错误，可以点「重试」刷新这个分段，
        <br />
        也可以回首页从头再来 ♨
      </p>

      {/* digest 是 Next.js 给服务端错误生成的短 hash，供用户报问题时引用 */}
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-plum-500">
          错误编号: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-sakura !py-3 !px-6"
        >
          <RefreshCw className="h-4 w-4" />
          重试
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-white px-6 py-3 font-bold text-plum-900 shadow-pop transition-all hover:-translate-y-0.5 hover:bg-sakura-100"
        >
          <Home className="h-4 w-4" />
          回首页
        </Link>
      </div>
    </div>
  );
}
