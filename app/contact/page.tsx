import { Mail, Heart, ShieldAlert } from "lucide-react";
import { FloatingBackButton } from "@/app/components/FloatingBackButton";

/*
 * 联系我们页 /contact
 * 业务意图：
 * - 提供通用邮箱 + 独立的 DMCA 版权投诉通道
 * - 把「版权投诉」做成独立一栏，避免被普通反馈淹没
 * 设计意图：
 * - 单卡片通用邮箱 + 一段版权通道说明 + 一段 FAQ
 * 关键约束：
 * - 当前只保留邮箱入口；社区群 / GitHub / Twitter / RSS 等渠道暂不对外展示
 */

// 通用联系渠道：仅保留邮箱入口，减少需维护的外部链路
const CHANNELS = [
  {
    icon: Mail,
    name: "通用邮箱",
    handle: "xiaodeng262@gmail.com",
    desc: "合作建议、站务咨询、志愿者申请都可以写信给我们。",
    color: "bg-sakura-200",
    ring: "hover:shadow-sakura",
  },
];

// FAQ：最常见的问题前置，减少重复邮件
const FAQS = [
  {
    q: "资源打不开怎么办？",
    a: "请前往「失效反馈」页提交，填写资源地址和问题类型即可，不需要发邮件。",
  },
  {
    q: "能帮我找一份资源吗？",
    a: "请在「发布」页选择「求助资源」，比单独发邮件更容易被看到，也能附带悬赏。",
  },
  {
    q: "你们会存储我分享的文件吗？",
    a: "不会。本站只接收外部链接，不托管任何影音文件，所有资源都存放在原链接服务商。",
  },
  {
    q: "想成为志愿者/审核员？",
    a: "欢迎！请通过通用邮箱联系我们，简单介绍一下你平时看什么番、可用时间段就行 🌸",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10 lg:py-16">
      <FloatingBackButton label="返回广场" />

      {/* 顶部标题 */}
      <div className="mb-12">
        <p className="marker mb-3">Get in Touch · 联系我们</p>
        <h1 className="flex flex-wrap items-baseline gap-3 font-pop text-5xl leading-tight text-plum-900 md:text-6xl">
          联系我们
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-plum-900 bg-lavender-100 px-3 py-1 text-sm shadow-pop">
            <Heart className="h-3 w-3 fill-sakura-500 text-sakura-500" />
            お問い合わせ
          </span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-sm leading-relaxed text-plum-700">
          我们是一群喜欢动漫的普通人，如果你有任何想法、建议、合作意向，都欢迎通过下面的渠道找到我们。
        </p>
      </div>

      {/* 联系渠道：仅保留邮箱入口
       * 仅一张卡片时不铺满栅格，控制在 md:w-2/3 lg:w-1/2，避免孤零零撑满一行显得尴尬 */}
      <section className="mb-14">
        <div className="md:w-2/3 lg:w-1/2">
          {CHANNELS.map((c) => (
            <ChannelCard key={c.name} {...c} />
          ))}
        </div>
      </section>

      {/* 版权投诉专用通道 */}
      <section className="mb-14">
        <div className="rounded-3xl border-[3px] border-plum-900 bg-vanilla-200 p-6 shadow-pop md:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border-[3px] border-plum-900 bg-white shadow-pop">
              <ShieldAlert className="h-6 w-6 text-sakura-600" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <div className="marker mb-2">DMCA · 版权投诉</div>
              <h2 className="font-pop text-2xl text-plum-900 md:text-3xl">
                版权方请走专用邮箱
              </h2>
              <p className="mt-3 font-display text-sm leading-relaxed text-plum-900 md:text-base">
                如果你是版权持有人或其授权代理，发现站内有链接指向了侵犯你权益的内容，请发邮件至{" "}
                <span className="rounded-md border-2 border-plum-900 bg-white px-2 py-0.5 font-mono text-xs">
                  xiaodeng262@gmail.com
                </span>
                ，并附上权属证明与涉及的资源链接。我们将在 24 小时内核实并下架相关条目。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 常见问题 */}
      <section>
        <p className="marker mb-4">FAQ · 常见问题</p>
        <div className="grid gap-5 md:grid-cols-2">
          {FAQS.map((f) => (
            <div key={f.q} className="bubble p-6">
              <h3 className="font-pop text-lg text-plum-900">{f.q}</h3>
              <p className="mt-2 font-display text-sm leading-relaxed text-plum-700">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 底部致谢 */}
      <div className="mt-16 text-center">
        <p className="font-display text-sm text-plum-700">
          感谢每一位在这里分享、求助、互助的你 🌸
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-plum-500">
          Made with <span className="text-sakura-600">♥</span> by fans, for fans
        </p>
      </div>
    </div>
  );
}

// 联系渠道卡片：图标 + 标题 + 句柄 + 描述
function ChannelCard({
  icon: Icon,
  name,
  handle,
  desc,
  color,
  ring,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  handle: string;
  desc: string;
  color: string;
  ring: string;
}) {
  return (
    <div
      className={`bubble group relative p-6 transition-all duration-300 hover:-translate-y-1 ${ring}`}
    >
      <div
        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-plum-900 shadow-pop ${color}`}
      >
        <Icon className="h-5 w-5 text-plum-900" />
      </div>
      <h3 className="font-pop text-xl text-plum-900">{name}</h3>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-sakura-600">
        {handle}
      </p>
      <p className="mt-3 font-display text-sm leading-relaxed text-plum-700">
        {desc}
      </p>
    </div>
  );
}
