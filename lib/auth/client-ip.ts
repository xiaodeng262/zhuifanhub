/*
 * 客户端 IP 提取
 *
 * 业务动机：
 * - 注册接口需按 IP 做去重，必须从 Request 头部还原"真实"客户端地址
 * - 直接读 socket 在 Next.js Route Handler 里拿不到，所以全部走头部方案
 *
 * 头部优先级（按生产环境最常见的代理链顺序）：
 * 1. cf-connecting-ip      —— 走 Cloudflare 时最准
 * 2. x-real-ip             —— Nginx / 单层反代约定
 * 3. x-forwarded-for       —— RFC 标准，多级代理时取首段（最靠近真实客户端那一跳）
 * 4. x-vercel-forwarded-for / fly-client-ip 等平台头作为兜底
 *
 * 设计约束：
 * - 任何头部都可能被伪造；本工具只负责"按约定取出"，反伪造由部署层保证
 *   （生产建议在反代里 unset 不可信的 X-Forwarded-For，再由反代自己重写）
 * - 取不到任何 IP 时返回 null，调用方按"未知 IP"处理（例如允许通过但记日志）
 */

const HEADER_PRIORITY = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
  "x-vercel-forwarded-for",
  "fly-client-ip",
  "true-client-ip",
] as const;

/*
 * 从 Request 头部解析出客户端 IP
 * - x-forwarded-for 可能形如 "client, proxy1, proxy2"，取首段
 * - 去掉两端空白与可能的端口号后缀（如 "1.2.3.4:5678"）
 * - 全部为空时返回 null
 */
export function getClientIp(req: Request): string | null {
  for (const name of HEADER_PRIORITY) {
    const raw = req.headers.get(name);
    if (!raw) continue;
    // x-forwarded-for 等头部可能拼接多个 IP，按 RFC 取最左侧
    const first = raw.split(",")[0]?.trim();
    if (!first) continue;
    const normalized = stripPort(first);
    if (normalized) return normalized;
  }
  return null;
}

/*
 * 去掉 IPv4 形如 "1.2.3.4:5678" 的端口；IPv6 保持原样
 * 不做严格校验，目的只是让同一客户端在不同请求中得到稳定的去重键
 */
function stripPort(ip: string): string {
  // IPv6 字面量通常被方括号包住："[::1]:1234"
  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    return end > 0 ? ip.slice(1, end) : ip;
  }
  // IPv4 只可能出现一个冒号；含多个冒号的视为裸 IPv6，原样返回
  const parts = ip.split(":");
  if (parts.length === 2) return parts[0];
  return ip;
}
