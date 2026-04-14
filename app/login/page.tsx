"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type PublicUser } from "@/app/components/AuthProvider";
import {
  ArrowLeft,
  Heart,
  Sparkles,
  Star,
  User,
  Lock,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

/*
 * 登录 / 注册页 v4
 * - 真正调用 /api/auth/register 与 /api/auth/login
 * - 失败显示服务端错误；成功后跳转到 ?next= 或首页
 * - 客户端仍做一次本地校验，减少无谓的网络请求
 */

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 注册模式下两次密码必须一致且长度 ≥ 6
  const canSubmit =
    username.trim().length >= 2 &&
    password.length >= 6 &&
    (mode === "signin" || password === confirm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      const endpoint =
        mode === "signin" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: PublicUser;
      };

      if (!res.ok) {
        setError(data.error || "操作失败，请稍后重试");
        setLoading(false);
        return;
      }

      // 成功后直接把 user 写进全局 context，Header 立即响应
      // 不再依赖 router.refresh() 的 RSC 重渲染
      if (data.user) setUser(data.user);
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("网络异常，请检查连接后重试");
      setLoading(false);
    }
  };

  // 切换登录/注册时清空错误与确认密码
  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setConfirm("");
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-180px)] max-w-[1400px] gap-10 px-6 py-12 lg:grid-cols-[1fr_460px] lg:px-10 lg:py-20">
      {/* 左栏：品牌区 */}
      <section className="relative flex flex-col justify-between overflow-hidden rounded-blob border-[3px] border-plum-900 bg-sakura-100 p-10 shadow-pop lg:p-14">
        {/* 背景漂浮装饰 */}
        <div className="pointer-events-none absolute right-10 top-16 animate-float text-7xl">
          🌸
        </div>
        <div className="pointer-events-none absolute bottom-20 right-24 animate-twinkle text-5xl">
          ✨
        </div>
        <div className="pointer-events-none absolute left-1/3 top-1/2 animate-float text-4xl [animation-delay:1s]">
          💖
        </div>

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 border-plum-900/30 bg-white px-4 py-2 font-display text-xs font-bold text-plum-700 transition-all hover:border-plum-900"
          >
            <ArrowLeft className="h-3 w-3" />
            返回首页
          </Link>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border-[3px] border-plum-900 bg-vanilla-300 px-4 py-1.5 shadow-pop">
            <Sparkles className="h-3.5 w-3.5 fill-plum-900" />
            <span className="font-pop text-xs text-plum-900">Welcome Home</span>
          </div>

          <h1 className="mt-6 font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
            这里是
            <br />
            追番向导的
            <br />
            <span className="relative inline-block">
              <span className="absolute inset-x-0 bottom-2 -z-10 h-[40%] -skew-y-2 rounded-lg bg-sakura-300" />
              <span className="relative text-sakura-600">新家 🏠</span>
            </span>
          </h1>
          <p className="mt-6 max-w-md font-display text-sm leading-relaxed text-plum-700">
            注册一个账号，就能发布资源、收藏心仪的番剧、参与评论 ✨
          </p>
        </div>

        <div className="relative mt-10 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border-[3px] border-plum-900 bg-white p-4 shadow-pop">
            <p className="font-pop text-2xl text-plum-900">2,486</p>
            <p className="mt-0.5 font-display text-xs text-plum-700">
              条已收录资源
            </p>
          </div>
          <div className="rounded-2xl border-[3px] border-plum-900 bg-white p-4 shadow-pop">
            <p className="font-pop text-2xl text-plum-900">13.4k</p>
            <p className="mt-0.5 font-display text-xs text-plum-700">活跃粉丝</p>
          </div>
        </div>
      </section>

      {/* 右栏：表单卡片 */}
      <section className="flex flex-col justify-center">
        <div className="relative">
          {/* 背层偏移彩块：营造贴纸层次 */}
          <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-1 rounded-blob border-[3px] border-plum-900 bg-lavender-300" />

          <div className="relative rounded-blob border-[3px] border-plum-900 bg-white p-8 shadow-pop">
            {/* 右上角星星装饰 */}
            <Star className="absolute -right-4 -top-4 h-10 w-10 animate-twinkle fill-vanilla-300 text-plum-900" />

            {/* tab 切换：登录 / 注册 */}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-full border-[3px] border-plum-900 bg-milk-200 p-1">
              <ModeTab
                active={mode === "signin"}
                onClick={() => switchMode("signin")}
                icon={<LogIn className="h-4 w-4" />}
                label="登录"
              />
              <ModeTab
                active={mode === "signup"}
                onClick={() => switchMode("signup")}
                icon={<UserPlus className="h-4 w-4" />}
                label="注册"
              />
            </div>

            <h2 className="font-pop text-3xl text-plum-900">
              {mode === "signin" ? "欢迎回来" : "创建新账号"}
            </h2>
            <p className="mt-1 font-display text-sm text-plum-700">
              {mode === "signin"
                ? "输入你的账号和密码继续追番"
                : "只要一个账号，就能开始分享资源"}
            </p>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <FormField label="账号" icon={<User className="h-4 w-4" />}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="2-16 位字母 / 数字 / 下划线"
                  className="w-full bg-transparent text-sm text-plum-900 placeholder:text-plum-500/50 focus:outline-none"
                  required
                />
              </FormField>

              <FormField label="密码" icon={<Lock className="h-4 w-4" />}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="w-full bg-transparent text-sm text-plum-900 placeholder:text-plum-500/50 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center text-plum-500 hover:text-sakura-600"
                  aria-label={showPwd ? "隐藏密码" : "显示密码"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </FormField>

              {mode === "signup" && (
                <FormField label="确认密码" icon={<Lock className="h-4 w-4" />}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="再输入一次密码"
                    className="w-full bg-transparent text-sm text-plum-900 placeholder:text-plum-500/50 focus:outline-none"
                    required
                  />
                </FormField>
              )}

              {/* 密码不一致提示：仅在注册、两次都填、且不一致时出现 */}
              {mode === "signup" && confirm.length > 0 && confirm !== password && (
                <p className="-mt-2 flex items-center gap-1 font-display text-xs text-sakura-600">
                  <Heart className="h-3 w-3 fill-sakura-500 text-sakura-500" />
                  两次密码不一致哦～
                </p>
              )}

              {/* 服务端错误横幅：注册冲突 / 登录失败 / 网络异常 */}
              {error && (
                <div className="flex items-start gap-2 rounded-2xl border-2 border-sakura-500 bg-sakura-100 px-3 py-2 font-display text-xs text-sakura-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="btn-sakura mt-2 w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:bg-sakura-500 disabled:hover:shadow-pop"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    请稍候…
                  </>
                ) : mode === "signin" ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    登录
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    立即注册
                  </>
                )}
              </button>

              {/* 辅助链接：忘记密码 / 切换模式 */}
              <div className="flex items-center justify-between font-display text-xs text-plum-700">
                {mode === "signin" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="font-bold text-sakura-600 hover:underline"
                    >
                      还没账号？去注册
                    </button>
                    <Link href="/forgot" className="hover:text-sakura-600">
                      忘记密码？
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="font-bold text-sakura-600 hover:underline"
                  >
                    已经有账号？去登录
                  </button>
                )}
              </div>
            </form>

            <p className="mt-6 rounded-2xl bg-milk-200 p-4 font-display text-[11px] leading-relaxed text-plum-700">
              {mode === "signup" ? "注册" : "登录"}即表示你同意
              <Link href="/rules" className="mx-1 font-bold text-sakura-600 hover:underline">
                《社区规则》
              </Link>
              与
              <Link href="/privacy" className="mx-1 font-bold text-sakura-600 hover:underline">
                《隐私说明》
              </Link>
              。我们不会主动收集任何与追番无关的数据 🌸
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// 登录 / 注册 tab
function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-full py-2 font-pop text-sm transition-all",
        active
          ? "bg-sakura-500 text-white shadow-[2px_2px_0_0_#2d1b3d]"
          : "text-plum-700 hover:text-plum-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// 表单字段容器：圆角 + 图标 + focus 环
function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-pop text-xs text-plum-900">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border-2 border-plum-900/15 bg-white px-4 py-3 transition-all focus-within:border-sakura-500 focus-within:ring-4 focus-within:ring-sakura-100">
        <span className="text-sakura-500">{icon}</span>
        {children}
      </div>
    </label>
  );
}
