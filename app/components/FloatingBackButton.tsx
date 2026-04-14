import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/*
 * 浮动返回按钮（FAB）
 * 业务意图：子页面内容较长时，让用户无需滑回顶部即可返回首页
 * 设计意图：
 * - 位置固定在右下角，与评论区/操作按钮都不冲突
 * - 圆角胶囊 + 樱花粉 + Pop 阴影，保持全站贴纸风格
 * - hover 时按钮扩展并抬起，暗示「可点击」
 * - 移动端位置略向内收，避免贴边
 */
export function FloatingBackButton({
  href = "/",
  label = "返回",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-sakura-500 px-5 py-3 font-pop text-sm text-white shadow-pop transition-all duration-300 hover:-translate-y-1 hover:-translate-x-0.5 hover:bg-sakura-600 hover:shadow-[6px_8px_0_0_#2d1b3d] md:bottom-10 md:right-10"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
