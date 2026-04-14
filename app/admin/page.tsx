import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminUser } from "@/lib/auth/admin";
import { listReports, reportStats } from "@/lib/store/reports";
import { AdminClient } from "./AdminClient";

/*
 * 后台管理页（Server Component）
 *
 * 职责：
 * 1. 鉴权：未登录 → 跳 /login?next=/admin；已登录但非管理员 → 同样跳走
 *    不引入 middleware.ts：单页保护直接在 server 里 redirect 最清晰
 * 2. 预加载举报列表 + 统计数据，交给 AdminClient 渲染
 *
 * 管理员识别通过环境变量 ADMIN_USERNAMES，见 lib/auth/admin.ts
 */

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    // 未登录或非管理员都跳登录，避免提示"无权限"泄露后台存在
    redirect("/login?next=/admin");
  }

  const [initialRecords, initialStats] = await Promise.all([
    listReports(),
    reportStats(),
  ]);

  return (
    <AdminClient
      initialRecords={initialRecords}
      initialStats={initialStats}
    />
  );
}
