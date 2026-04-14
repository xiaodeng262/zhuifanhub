/** @type {import('next').NextConfig} */
const nextConfig = {
  // 产出 standalone bundle：仅复制运行时必需的 node_modules 子集 + server.js
  // 业务动机：Docker 镜像从 ~1GB 缩到 ~200MB，加快 GitHub Actions 构建/推送/拉取
  output: "standalone",
  images: {
    // 允许使用外部图床做封面图（MVP 阶段用 Unsplash 占位）
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
