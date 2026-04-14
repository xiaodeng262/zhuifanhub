import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash, randomBytes } from "crypto";
import path from "path";

/*
 * 对象存储适配层
 *
 * 目标：提供 uploadBuffer() 一个函数，调用方传入二进制数据 + MIME 类型，
 * 返回可公开访问的 URL。底层使用 AWS SDK v3 + 雨云 S3 兼容协议。
 *
 * 配置来源（环境变量）：
 * - S3_ENDPOINT      例如 https://cn-sy1.rains3.com
 * - S3_REGION        对接雨云时填 "rainyun"（或任意字符串，SDK 要求非空）
 * - S3_BUCKET        存储桶名称
 * - S3_ACCESS_KEY    雨云 AccessKey
 * - S3_SECRET_KEY    雨云 SecretKey
 * - S3_PUBLIC_BASE   可选：自定义公开访问基础 URL（CDN 或自定义域名）
 *                    未提供时自动拼 {endpoint}/{bucket}/{key}
 *
 * 未来替换成其它兼容服务（腾讯 COS / 阿里 OSS / Cloudflare R2）只需改环境变量。
 */

interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicBase?: string;
}

/*
 * 读取并校验环境变量
 * 缺少任何一项都抛 Error，调用方（/api/upload）捕获后返回 503
 * 这样部署时忘记配置会立刻暴露问题而不是静默失败
 */
function readConfig(): S3Config {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "rainyun";
  const bucket = process.env.S3_BUCKET;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const publicBase = process.env.S3_PUBLIC_BASE;

  const missing: string[] = [];
  if (!endpoint) missing.push("S3_ENDPOINT");
  if (!bucket) missing.push("S3_BUCKET");
  if (!accessKey) missing.push("S3_ACCESS_KEY");
  if (!secretKey) missing.push("S3_SECRET_KEY");
  if (missing.length > 0) {
    throw new Error(
      `对象存储未配置：缺少环境变量 ${missing.join(", ")}`
    );
  }

  return {
    endpoint: endpoint!,
    region,
    bucket: bucket!,
    accessKey: accessKey!,
    secretKey: secretKey!,
    publicBase,
  };
}

/*
 * 客户端缓存：避免每次请求都新建 S3Client（昂贵）
 * lazy init 的原因：环境变量在模块加载时可能未就绪（比如测试环境）
 */
let cachedClient: { client: S3Client; config: S3Config } | null = null;

function getClient(): { client: S3Client; config: S3Config } {
  if (cachedClient) return cachedClient;
  const config = readConfig();
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    // 路径风格：雨云 / MinIO 等大多数自建 S3 都要求 path-style
    // 否则 SDK 会尝试 bucket.endpoint 子域名访问
    forcePathStyle: true,
  });
  cachedClient = { client, config };
  return cachedClient;
}

/*
 * 生成对象 key
 *
 * 规则：prefix/<date>/<sha1>.<ext>
 * - date 用 yyyyMM 分桶，避免单目录文件过多影响运维
 * - sha1 保证幂等：同一份文件多次上传产生相同 key，天然去重
 * - ext 来自原文件名 + MIME 推断，避免无后缀
 */
function buildKey(
  buffer: Buffer,
  originalName: string | undefined,
  contentType: string,
  prefix: string
): string {
  const hash = createHash("sha1").update(buffer).digest("hex");
  const dateSeg = new Date().toISOString().slice(0, 7).replace("-", ""); // yyyyMM

  // 先从文件名取扩展名；失败再从 MIME 推
  let ext = "";
  if (originalName) {
    const parsed = path.extname(originalName).toLowerCase().replace(".", "");
    if (parsed && /^[a-z0-9]{1,6}$/.test(parsed)) ext = parsed;
  }
  if (!ext) ext = mimeToExt(contentType);

  // 加 4 字节随机后缀防止不同用户恰好哈希碰撞时互相覆盖
  // 对 SHA-1 而言实用上不可能，但加这点成本可忽略
  const salt = randomBytes(2).toString("hex");
  return `${prefix}/${dateSeg}/${hash}-${salt}${ext ? "." + ext : ""}`;
}

// MIME → 扩展名最小映射：只支持常见图片类型
function mimeToExt(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  if (m === "image/avif") return "avif";
  return "bin";
}

/*
 * 上传 Buffer 到对象存储
 *
 * @param buffer        文件二进制
 * @param contentType   MIME 类型
 * @param originalName  原文件名（可选，用于推断扩展名）
 * @param prefix        对象 key 前缀，默认 "covers"；可按用途区分 avatars / covers / attachments
 *
 * @returns { url, key } 公开 URL + S3 key
 *
 * 注意：bucket 必须是公开读，否则返回的 url 无法直接访问。
 * 如果需要私有 + 临时签名访问，使用 lib/storage/s3.ts 另加的 presign 函数。
 */
export async function uploadBuffer(params: {
  buffer: Buffer;
  contentType: string;
  originalName?: string;
  prefix?: string;
}): Promise<{ url: string; key: string }> {
  const { client, config } = getClient();
  const key = buildKey(
    params.buffer,
    params.originalName,
    params.contentType,
    params.prefix ?? "covers"
  );

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType,
      // 公开读取：访问者无需签名
      // 对应 MVP 需求；后续若改成私有桶，此字段改为 "private"
      ACL: "public-read",
    })
  );

  // 优先使用 S3_PUBLIC_BASE（可配 CDN 加速）
  // 兜底：直接拼接 endpoint + bucket + key（path-style 约定）
  const base = config.publicBase ?? `${config.endpoint}/${config.bucket}`;
  const url = `${base.replace(/\/$/, "")}/${key}`;
  return { url, key };
}

/*
 * 便捷判断：当前环境是否已配置对象存储
 * 前端可用来决定是否显示"文件上传"UI，未配置则只显示 URL 输入
 */
export function isStorageConfigured(): boolean {
  try {
    readConfig();
    return true;
  } catch {
    return false;
  }
}
