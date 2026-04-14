import {
  BookOpen,
  Check,
  X,
  Shield,
  Heart,
  Flag,
  Upload,
  MessageCircle,
} from "lucide-react";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";

/*
 * 使用规则页 /rules
 * 业务意图：
 * - 明确「本站仅承载链接，不托管任何文件」的核心定位
 * - 告诉用户「该做什么 / 不该做什么」，减少违规与举报
 * 设计意图：
 * - 顶部版权/免责声明放在最醒目的位置，避免法律风险
 * - Do / Don't 对照卡片，便于快速扫读
 * - 每条规则都给出简短解释，避免让用户感觉只是规训
 */

// Do 列表：鼓励的行为
const DOS = [
  { icon: Upload, text: "分享来源合法的外部链接（网盘 / 磁力 / BT / 追番站）" },
  { icon: MessageCircle, text: "描述越详细越好，附上画质、字幕、压制组信息" },
  { icon: Heart, text: "对他人的分享与求助保持友善与耐心" },
  { icon: Flag, text: "遇到失效资源或违规内容，主动反馈 / 举报" },
];

// Don't 列表：禁止的行为
const DONTS = [
  "在站内直接上传、托管、转存任何影音文件",
  "发布真实盗版商用内容、破解服务、付费解密服务",
  "发布涉及未成年人的不适当内容，以及任何违法信息",
  "重复灌水、恶意刷帖、人身攻击、广告引流",
  "盗用他人封面、描述或资源而不加说明",
];

// 站点立场声明：顶部免责声明
const DISCLAIMERS = [
  "本站为粉丝自发维护的互助平台，不以任何方式盈利。",
  "本站仅提供外部链接的集散与检索，不存储、不转码、不分发任何资源文件。",
  "所有链接的版权归原版权方所有，若涉及版权问题，请通过「联系我们」告知，我们将在核实后 24 小时内处理。",
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      {/* 顶部标题 */}
      <div className="mb-12">
        <p className="marker mb-3">House Rules · 使用规则</p>
        <h1 className="flex flex-wrap items-baseline gap-3 font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          使用规则
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-plum-900 bg-sky2-200 px-3 py-1 text-sm shadow-pop">
            <BookOpen className="h-3 w-3 text-plum-900" />
            ルール
          </span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          我们希望追番向导是一个轻松、友善、互相帮助的地方。请花一分钟阅读这些规则，让社区更好～ 🌸
        </p>
      </div>

      {/* 免责声明：高优先级，用香草黄硬卡承载 */}
      <section className="mb-12">
        <div className="rounded-3xl border-[3px] border-plum-900 bg-vanilla-200 p-6 shadow-pop md:p-8">
          <div className="mb-4 flex items-center gap-2 font-pop text-lg text-plum-900">
            <Shield className="h-5 w-5" />
            站点定位 & 免责声明
          </div>
          <ul className="space-y-3">
            {DISCLAIMERS.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 font-display text-sm leading-relaxed text-plum-900 md:text-base"
              >
                <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-sakura-500" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Do / Don't 对照卡片 */}
      <section className="mb-12 grid gap-6 md:grid-cols-2">
        {/* Do */}
        <div className="bubble p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-mint-300 shadow-pop">
              <Check className="h-4 w-4 text-plum-900" />
            </span>
            <h2 className="font-pop text-2xl text-plum-900">请这样做</h2>
          </div>
          <ul className="space-y-4">
            {DOS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint-500" />
                <span className="font-display text-sm leading-relaxed text-plum-700">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Don't */}
        <div className="bubble p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-sakura-300 shadow-pop">
              <X className="h-4 w-4 text-plum-900" />
            </span>
            <h2 className="font-pop text-2xl text-plum-900">请不要这样</h2>
          </div>
          <ul className="space-y-4">
            {DONTS.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-sakura-600" />
                <span className="font-display text-sm leading-relaxed text-plum-700">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 违规处理 */}
      <section className="mb-12">
        <p className="marker mb-4">Enforcement · 违规处理</p>
        <div className="bubble p-6 md:p-8">
          <ol className="space-y-4">
            <RuleStep
              no="01"
              title="首次违规 · 提醒"
              desc="我们会删除相关内容并私信解释原因，给你一次修改重发的机会。"
            />
            <RuleStep
              no="02"
              title="多次违规 · 限制发布"
              desc="账号会被暂时限制发布 7 天，期间仍可浏览和评论。"
            />
            <RuleStep
              no="03"
              title="严重违规 · 永久封禁"
              desc="涉及违法内容、重复恶意灌水、人身攻击等情况，将直接永久封禁账号。"
            />
          </ol>
        </div>
      </section>

      {/* 底部温馨提示 */}
      <div className="rounded-3xl border-[3px] border-plum-900 bg-lavender-100 p-6 shadow-pop">
        <div className="mb-2 flex items-center gap-2 font-pop text-sm text-plum-900">
          <Heart className="h-4 w-4 fill-sakura-500 text-sakura-500" />
          写在最后
        </div>
        <p className="font-display text-xs leading-relaxed text-plum-700 md:text-sm">
          规则是为了让大家更自由地分享，而不是束缚。如果你觉得某条规则不合理，欢迎通过「联系我们」提出建议，我们会认真讨论每一条反馈 ✨
        </p>
      </div>
    </div>
  );
}

// 违规处理单步：编号 + 标题 + 描述
function RuleStep({
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
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-sakura-200 font-pop text-sm text-plum-900 shadow-pop">
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
