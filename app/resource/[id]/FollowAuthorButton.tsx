"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

/*
 * 作者信息卡中的「关注该用户 / 已关注」按钮
 *
 * 独立成一个小组件的原因：
 * - 详情页右侧栏是 server 渲染，只这一个按钮需要客户端状态
 * - 抽出来避免把整个 aside 提到 client 侧
 *
 * 规则：
 * - 未登录 → 跳 /login
 * - 登录用户 === 作者本人 → 按钮 disabled，提示"这是你自己"
 * - 其它 → 乐观更新 + 调用关注 / 取消关注 API
 */
export function FollowAuthorButton({
  authorId,
  resourceId,
  initialFollowing,
}: {
  authorId: string;
  resourceId: string;
  initialFollowing: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  // 种子数据的作者是伪造的 "seed"，不能被关注
  const authorIsSeed = authorId === "seed";
  const isSelf = user?.id === authorId;

  async function toggle() {
    if (!user) {
      router.push(`/login?next=/resource/${resourceId}`);
      return;
    }
    if (isSelf || authorIsSeed || busy) return;

    const next = !following;
    setFollowing(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${authorId}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  if (isSelf) {
    return (
      <button
        disabled
        className="btn-outline mt-5 w-full !py-2 text-sm opacity-60"
      >
        这是你自己哦
      </button>
    );
  }

  if (authorIsSeed) {
    return (
      <button
        disabled
        className="btn-outline mt-5 w-full !py-2 text-sm opacity-60"
      >
        系统种子资源
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`mt-5 w-full !py-2 text-sm disabled:opacity-60 ${
        following ? "btn-outline" : "btn-sakura"
      }`}
    >
      {following ? "已关注" : "关注该用户"}
    </button>
  );
}
