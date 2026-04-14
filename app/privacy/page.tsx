import type { Metadata } from "next";
import {
  Shield,
  Database,
  Cookie,
  UserX,
  Mail,
  Lock,
  Eye,
  Heart,
} from "lucide-react";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";

/*
 * 页面级 metadata
 * title 自动拼上根 layout 的 template "· 追番向导"
 * 隐私页不需要被广泛索引/分享，robots 保持默认 index 即可
 */
export const metadata: Metadata = {
  title: "隐私说明",
  description:
    "追番向导只收集让站点正常运转的最小必要数据，不贩卖用户信息。本页说明我们收集什么、不收集什么、如何使用、用户有哪些权利。",
};

/*
 * 隐私说明页 /privacy
 * 业务意图：
 * - 用户注册 / 登录页底部会引用《隐私说明》，必须提供一个真实页面，否则构成合规瑕疵
 * - 站点本身「只做链接集散，不存储文件」的立场决定了隐私承诺可以非常简洁
 *
 * 设计意图：
 * - 顶部一句话核心立场："只收集追番必需的数据"
 * - 接下来五张卡片分条说明：收集什么、不收集什么、怎么用、谁能看到、权利
 * - 视觉上复用 /rules 页面的版式，保持 Pop 风格一致性
 *
 * 关键约束：
 * - 所有描述必须与代码实际行为一致（不要写"用于广告分析"之类没有实际实现的承诺）
 * - 若未来接入第三方分析 / 广告 / 登录服务，必须同步更新本页
 */

// 收集的数据项：逐条列，用户能一眼看完
const COLLECTED = [
  {
    label: "账号信息",
    desc: "注册时填写的用户名；密码只以加盐哈希形式存储，我们无法还原明文。",
  },
  {
    label: "发布内容",
    desc: "你主动发布的资源、评论、反馈、举报及对应时间戳。",
  },
  {
    label: "互动行为",
    desc: "收藏、关注、点赞等操作的时间与目标 ID，用于构建你的个人中心视图。",
  },
  {
    label: "技术日志",
    desc: "服务器自动记录的请求 IP、User-Agent 与错误日志，仅用于排障与滥用识别，定期轮转清理。",
  },
];

// 明确不收集的项：打消常见顾虑
const NOT_COLLECTED = [
  "真实姓名、身份证、手机号等现实身份信息",
  "位置数据、通讯录、相册等设备权限",
  "观看历史、搜索关键词以外的行为画像",
  "第三方广告、行为追踪脚本（本站暂未接入任何广告 SDK）",
];

// 使用场景：告诉用户数据会"被做什么"
const USAGES = [
  {
    icon: Eye,
    title: "展示你的内容",
    desc: "在个人中心、资源详情页展示你的发布、收藏与反馈状态。",
  },
  {
    icon: Shield,
    title: "维护社区秩序",
    desc: "依据日志识别恶意灌水、刷评、盗用等异常行为，并按《使用规则》处理。",
  },
  {
    icon: Mail,
    title: "必要的站务通知",
    desc: "向你推送评论回复、@提及和资源失效通知，均可在设置中关闭。",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      {/* 顶部标题：复用 rules 页的风格 */}
      <div className="mb-12">
        <p className="marker mb-3">Privacy · 隐私说明</p>
        <h1 className="flex flex-wrap items-baseline gap-3 font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          隐私说明
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-plum-900 bg-lavender-100 px-3 py-1 text-sm shadow-pop">
            <Shield className="h-3 w-3 text-plum-900" />
            プライバシー
          </span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          我们是一群喜欢动漫的普通人，追番向导不靠卖数据活着。本页用大白话告诉你：我们收集什么、不收集什么、会怎么用 🌸
        </p>
      </div>

      {/* 核心承诺：用香草黄硬卡突出 */}
      <section className="mb-12">
        <div className="rounded-3xl border-[3px] border-plum-900 bg-vanilla-200 p-6 shadow-pop md:p-8">
          <div className="mb-4 flex items-center gap-2 font-pop text-lg text-plum-900">
            <Lock className="h-5 w-5" />
            我们的承诺
          </div>
          <ul className="space-y-3">
            <Bullet>只收集让追番向导能正常运转的最小必要数据。</Bullet>
            <Bullet>
              绝不售卖、交换、泄露你的任何数据给第三方；仅在司法机关依法要求时配合调取。
            </Bullet>
            <Bullet>
              所有密码均以加盐哈希形式存储，我们自己也看不到你的明文密码。
            </Bullet>
            <Bullet>
              本站当前不接入任何广告 SDK、行为分析脚本或第三方登录服务。
            </Bullet>
          </ul>
        </div>
      </section>

      {/* 收集 vs 不收集：对照卡 */}
      <section className="mb-12 grid gap-6 md:grid-cols-2">
        {/* 收集 */}
        <div className="bubble p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-sky2-200 shadow-pop">
              <Database className="h-4 w-4 text-plum-900" />
            </span>
            <h2 className="font-pop text-2xl text-plum-900">我们收集</h2>
          </div>
          <ul className="space-y-4">
            {COLLECTED.map((c) => (
              <li key={c.label} className="flex flex-col gap-1">
                <span className="font-pop text-sm text-plum-900">
                  · {c.label}
                </span>
                <span className="pl-3 font-display text-xs leading-relaxed text-plum-700 md:text-sm">
                  {c.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 不收集 */}
        <div className="bubble p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-sakura-300 shadow-pop">
              <UserX className="h-4 w-4 text-plum-900" />
            </span>
            <h2 className="font-pop text-2xl text-plum-900">我们不收集</h2>
          </div>
          <ul className="space-y-4">
            {NOT_COLLECTED.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <UserX className="mt-0.5 h-4 w-4 flex-shrink-0 text-sakura-600" />
                <span className="font-display text-sm leading-relaxed text-plum-700">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 数据使用场景 */}
      <section className="mb-12">
        <p className="marker mb-4">How we use it · 数据会被做什么</p>
        <div className="grid gap-5 md:grid-cols-3">
          {USAGES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bubble p-5 md:p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-mint-300 shadow-pop">
                <Icon className="h-4 w-4 text-plum-900" />
              </div>
              <h3 className="font-pop text-lg text-plum-900">{title}</h3>
              <p className="mt-2 font-display text-sm leading-relaxed text-plum-700">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Cookie 说明：单独一节，因为法律口径关注它 */}
      <section className="mb-12">
        <div className="bubble p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-vanilla-300 shadow-pop">
              <Cookie className="h-4 w-4 text-plum-900" />
            </span>
            <h2 className="font-pop text-2xl text-plum-900">Cookie 使用</h2>
          </div>
          <p className="font-display text-sm leading-relaxed text-plum-700 md:text-base">
            追番向导仅使用一个名为
            <code className="mx-1 rounded-md border-2 border-plum-900 bg-white px-1.5 py-0.5 font-mono text-xs">
              zhuifan_session
            </code>
            的 httpOnly Cookie 来维持登录状态。它由服务器端签名，不包含任何
            可读的个人信息，默认有效期 30 天。除此之外我们不下发任何统计 / 广告 / 跨站追踪类 Cookie。
          </p>
        </div>
      </section>

      {/* 用户权利 */}
      <section className="mb-12">
        <p className="marker mb-4">Your Rights · 你的权利</p>
        <div className="bubble p-6 md:p-8">
          <ol className="space-y-4">
            <RightStep
              no="01"
              title="查看与导出"
              desc="在「个人中心」可随时查看你的所有发布、收藏与反馈；如需打包导出，请通过联系邮箱申请。"
            />
            <RightStep
              no="02"
              title="更正"
              desc="你发布的资源、评论可以随时编辑或删除；账号信息可在个人中心修改。"
            />
            <RightStep
              no="03"
              title="删除账号"
              desc="通过联系邮箱发起注销申请，我们将在核实身份后 7 天内清空你的账号及全部关联数据。"
            />
          </ol>
        </div>
      </section>

      {/* 变更与联系 */}
      <div className="rounded-3xl border-[3px] border-plum-900 bg-lavender-100 p-6 shadow-pop">
        <div className="mb-2 flex items-center gap-2 font-pop text-sm text-plum-900">
          <Heart className="h-4 w-4 fill-sakura-500 text-sakura-500" />
          本说明如有变更
        </div>
        <p className="font-display text-xs leading-relaxed text-plum-700 md:text-sm">
          任何实质性修改（例如接入新的第三方服务、变更数据用途）都会在「公告」页提前 7 天通知所有用户。对本页内容有疑问或建议，请通过
          <span className="mx-1 rounded-md border-2 border-plum-900 bg-white px-2 py-0.5 font-display text-[11px] font-bold">
            联系我们
          </span>
          页面中的邮箱与我们沟通。
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-plum-500">
          Last updated · 2026-04-13
        </p>
      </div>
    </div>
  );
}

// 小圆点项：用于"我们的承诺"列表
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 font-display text-sm leading-relaxed text-plum-900 md:text-base">
      <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-sakura-500" />
      {children}
    </li>
  );
}

// 编号步骤项：复用 rules 页 RuleStep 的视觉
function RightStep({
  no,
  title,
  desc,
}: {
  no: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-lavender-300 font-pop text-sm text-plum-900 shadow-pop">
        {no}
      </span>
      <div>
        <h3 className="font-pop text-lg text-plum-900">{title}</h3>
        <p className="mt-1 font-display text-sm leading-relaxed text-plum-700">
          {desc}
        </p>
      </div>
    </li>
  );
}
