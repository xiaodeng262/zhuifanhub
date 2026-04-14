"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  ImageIcon,
  Info,
  Sparkles,
  Heart,
  Shuffle,
  UploadCloud,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";
import { useAuth } from "@/app/components/AuthProvider";
import { CATEGORIES } from "@/lib/data";
import type { Category } from "@/lib/types";

/*
 * 发布页 v2 · 卡通 Pop
 *
 * 接入后端后流程：
 * 1. 顶部 useAuth 判断登录态；未登录跳 /login?next=/publish
 * 2. 提交 POST /api/resources，成功后 router.push 到新详情页
 * 3. 封面改为 URL 输入 + "随机示例图"按钮（MVP 不做文件上传）
 *
 * 为什么不保留原"拖拽上传"占位 UI：
 * - 拖拽上传会让用户误以为能选本地图片，但 MVP 后端不支持
 *   会破坏"所见即所得"原则
 * - 改成 URL + 随机示例按钮最诚实，也最简单
 */

type Kind = "share" | "seek";

// 随机示例封面池：MVP 期间引导用户快速填入演示图
const SAMPLE_COVERS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551913902-c92207136625?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1612036782180-6f0822045d23?auto=format&fit=crop&w=1200&q=80",
];

export default function PublishPage() {
  const router = useRouter();
  const { user, loaded } = useAuth();

  const [kind, setKind] = useState<Kind>("share");
  const [category, setCategory] = useState<Category>("new-anime");
  const [title, setTitle] = useState("");
  const [alias, setAlias] = useState("");
  const [cover, setCover] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<{ label: string; url: string }[]>([
    { label: "", url: "" },
  ]);
  const [bounty, setBounty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 封面文件上传相关状态
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 未登录拦截：loaded=true 且 user=null 时才跳
  // （loaded=false 时先占位，避免刷新时闪一下登录页）
  useEffect(() => {
    if (loaded && !user) {
      router.replace("/login?next=/publish");
    }
  }, [loaded, user, router]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));
  const addLink = () => setLinks([...links, { label: "", url: "" }]);
  const removeLink = (i: number) =>
    setLinks(links.length > 1 ? links.filter((_, idx) => idx !== i) : links);
  const updateLink = (i: number, field: "label" | "url", value: string) =>
    setLinks(
      links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );

  const pickRandomCover = () => {
    const pick = SAMPLE_COVERS[Math.floor(Math.random() * SAMPLE_COVERS.length)];
    setCover(pick);
  };

  /*
   * 封面文件上传：走 /api/upload
   * - 失败单独存 uploadError，不污染表单主错误态
   * - 成功后直接把返回 URL 写进 cover 输入框
   * - 选了文件立即上传，无需额外"确认"步骤
   */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "covers");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "上传失败");
      }
      setCover(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      // 清空 input 的值，允许重复选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // 前端先做基础检查，减少来回
    if (!title.trim()) return setError("请填写资源标题");
    if (!description.trim()) return setError("请填写资源描述");
    if (!cover.trim() || !/^https?:\/\//i.test(cover.trim())) {
      return setError("请提供 http/https 开头的封面图地址");
    }

    // 分享贴必须有至少一条有效链接
    const validLinks = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label && l.url);
    if (kind === "share" && validLinks.length === 0) {
      return setError("分享贴至少需要一条有效链接");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          alias: alias.trim() || undefined,
          cover: cover.trim(),
          category,
          kind,
          tags,
          description: description.trim(),
          links: validLinks,
          bounty: kind === "seek" && bounty ? Number(bounty) : undefined,
        }),
      });
      const data = (await res.json()) as {
        resource?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.resource) {
        throw new Error(data.error || "发布失败");
      }
      // 发布成功：跳转到新详情页
      router.push(`/resource/${data.resource.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络异常，请重试");
      setSubmitting(false);
    }
  }

  // 登录态未确定或未登录时显示占位
  if (!loaded || !user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="font-display text-sm text-plum-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      <div className="mb-10">
        <p className="marker mb-3">New Post · 新帖编辑</p>
        <h1 className="font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          发布一则
          <span className="ml-3 text-sakura-600">
            {kind === "share" ? "分享" : "求助"}
          </span>
          <span className="ml-2">{kind === "share" ? "🌸" : "🥺"}</span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          你可以分享一条你珍藏的资源，也可以请粉丝们帮你找一份找不到的番剧。
          请注意：本站只接受外部链接（网盘、磁力、BT 种子、追番站等），不托管任何文件 ✨
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        {/* 左：表单 */}
        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          {/* 类型切换 */}
          <div>
            <label className="marker mb-3 block">发布类型</label>
            <div className="grid grid-cols-2 gap-4">
              <KindButton
                active={kind === "share"}
                onClick={() => setKind("share")}
                title="分享资源"
                icon="🌸"
                desc="我要分享一份番剧 / 壁纸 / 工具"
                color="bg-sakura-200"
              />
              <KindButton
                active={kind === "seek"}
                onClick={() => setKind("seek")}
                title="求助资源"
                icon="🥺"
                desc="我在找一份怎么都找不到的资源"
                color="bg-mint-300"
              />
            </div>
          </div>

          <Field label="分类" required>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={clsx(
                    "rounded-full border-[3px] border-plum-900 px-4 py-1.5 font-pop text-xs shadow-pop transition-all",
                    category === c.key
                      ? "bg-sakura-500 text-white"
                      : "bg-white text-plum-900 hover:bg-sakura-100"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Field>

          <Field label="番剧名称 / 标题" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：葬送的芙莉莲"
              className="input"
              maxLength={80}
            />
          </Field>

          <Field label="日文 / 原名（可选）">
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="葬送のフリーレン"
              className="input"
            />
          </Field>

          <Field label="封面图" required>
            <div className="flex flex-col gap-3">
              {/* 隐藏的 file input，由下方按钮触发 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder="https://... 也可直接粘贴外链"
                  className="input flex-1 min-w-[240px]"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-sakura !py-3 !px-4 text-xs disabled:opacity-60"
                  title="上传本地图片到对象存储"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  {uploading ? "上传中" : "上传图片"}
                </button>
                <button
                  type="button"
                  onClick={pickRandomCover}
                  className="btn-outline !py-3 !px-4 text-xs"
                  title="从示例封面库随机选一张"
                >
                  <Shuffle className="h-4 w-4" />
                  随机
                </button>
              </div>

              {uploadError && (
                <p className="rounded-2xl bg-sakura-100 px-3 py-2 font-display text-xs text-sakura-700">
                  {uploadError}
                </p>
              )}

              {cover && /^https?:\/\//i.test(cover) && (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-plum-900/15 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt="封面预览"
                    className="h-20 w-28 rounded-xl border-2 border-plum-900/10 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-display text-xs text-plum-700">
                      预览生效后发布才会保存这张封面
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-plum-500">
                      支持 JPG / PNG / WebP · 不超过 5 MB
                    </p>
                  </div>
                </div>
              )}
              {!cover && (
                <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-plum-500">
                  <ImageIcon className="h-3 w-3" />
                  还没有封面？点「上传图片」或「随机」试一张
                </p>
              )}
            </div>
          </Field>

          <Field label="描述" required>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder={
                kind === "share"
                  ? "介绍一下这份资源：画质参数、字幕情况、压制来源、亮点…"
                  : "描述你在找的版本特征：画质、字幕、母带、哪里见过…越详细越容易被找到 ✨"
              }
              className="input resize-none"
              maxLength={2000}
            />
          </Field>

          <Field label="标签（最多 8 个）">
            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="输入后回车，如 1080P / 简中"
                className="input flex-1"
                disabled={tags.length >= 8}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-outline !py-3 !px-5 text-sm"
                disabled={tags.length >= 8}
              >
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-plum-900 bg-sakura-500 px-3 py-1 font-pop text-xs text-white"
                  >
                    {t}
                    <button type="button" onClick={() => removeTag(t)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          {kind === "share" ? (
            <Field label="资源链接（可添加多个）" required>
              <div className="flex flex-col gap-3">
                {links.map((l, i) => (
                  <div
                    key={i}
                    className="grid gap-2 rounded-2xl border-2 border-plum-900/15 bg-white p-3 md:grid-cols-[1fr_2fr_auto]"
                  >
                    <input
                      value={l.label}
                      onChange={(e) => updateLink(i, "label", e.target.value)}
                      placeholder="名称 / 提取码"
                      className="input !py-2 !text-sm"
                    />
                    <input
                      value={l.url}
                      onChange={(e) => updateLink(i, "url", e.target.value)}
                      placeholder="https:// 或 magnet:"
                      className="input !py-2 !text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-plum-900/30 text-plum-700 transition-all hover:border-sakura-500 hover:bg-sakura-100 hover:text-sakura-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLink}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-plum-900/30 py-4 font-pop text-sm text-plum-700 transition-all hover:border-plum-900 hover:bg-sakura-100 hover:text-sakura-600"
                >
                  <Plus className="h-4 w-4" />
                  添加一条链接
                </button>
              </div>
            </Field>
          ) : (
            <Field label="悬赏积分（可选）">
              <input
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                type="number"
                placeholder="例如 200"
                className="input"
              />
              <p className="mt-2 font-display text-xs text-plum-500">
                💰 积分将在帮你找到资源的用户确认后发放
              </p>
            </Field>
          )}

          {error && (
            <div className="rounded-2xl border-2 border-sakura-500 bg-sakura-100 px-4 py-3 font-display text-sm text-sakura-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="btn-sakura disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {submitting ? "发布中..." : "立即发布"}
            </button>
          </div>
        </form>

        {/* 右：预览 + 规则 */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="bubble p-6">
            <div className="marker mb-4">实时预览</div>
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-plum-900 bg-sakura-300 px-3 py-1 font-pop text-[10px] text-plum-900">
                {kind === "share" ? "资源分享" : "求助贴"}
              </span>
              <h3 className="font-pop text-2xl leading-tight text-plum-900">
                {title || "在左侧输入标题…"}
              </h3>
              {alias && (
                <p className="font-display text-sm font-bold text-plum-500">
                  {alias}
                </p>
              )}
              <p className="font-display text-sm text-plum-700">
                {description || "描述会出现在这里，给看帖的人一点背景 ✨"}
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tags.map((t, i) => (
                    <span
                      key={t}
                      className={`chip ${["chip-pink", "chip-blue", "chip-lavender", "chip-yellow"][i % 4]}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 规则卡 */}
          <div className="rounded-3xl border-[3px] border-plum-900 bg-vanilla-200 p-6 shadow-pop">
            <div className="mb-3 flex items-center gap-2 font-pop text-sm text-plum-900">
              <Info className="h-4 w-4" />
              发布须知
            </div>
            <ul className="space-y-2 font-display text-xs leading-relaxed text-plum-900">
              <li>🌸 本站只允许贴外部链接，绝不托管任何资源文件</li>
              <li>🌸 链接可以是百度网盘、阿里云盘、115、磁力、BT 种子、追番站等</li>
              <li>🌸 请勿发布真实盗版商用内容，也不要提供解密服务</li>
              <li>🌸 若链接失效，请在资源详情页点「失效反馈」</li>
              <li>🌸 遇到广告引流 / 违规内容，请使用「举报」按钮</li>
              <li>🌸 我们保留删除重复贴或低质贴的权利</li>
            </ul>
          </div>

          {/* 小贴士卡 */}
          <div className="rounded-3xl border-[3px] border-plum-900 bg-lavender-100 p-5 shadow-pop">
            <div className="mb-2 flex items-center gap-1.5 font-pop text-sm text-plum-900">
              <Heart className="h-4 w-4 fill-sakura-500 text-sakura-500" />
              小贴士
            </div>
            <p className="font-display text-xs leading-relaxed text-plum-700">
              描述写得越清楚，越容易被搜索到哦～带上画质、字幕、压制组信息最好！
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 表单字段包装
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 font-pop text-sm text-plum-900">
        {label}
        {required && <span className="text-sakura-600">*</span>}
      </label>
      {children}
    </div>
  );
}

function KindButton({
  active,
  onClick,
  title,
  icon,
  desc,
  color,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: string;
  desc: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "group relative rounded-3xl border-[3px] p-5 text-left transition-all",
        active
          ? `border-plum-900 ${color} shadow-pop`
          : "border-plum-900/20 bg-white hover:border-plum-900 hover:shadow-pop"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="font-pop text-lg text-plum-900">{title}</div>
          <p className="mt-0.5 font-display text-xs text-plum-700">{desc}</p>
        </div>
      </div>
    </button>
  );
}
