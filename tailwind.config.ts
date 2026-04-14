import type { Config } from "tailwindcss";

/**
 * 追番向导主题 v2 · 樱花 Pop Idol
 * 设计语言：少女漫画杂志 × Y2K kawaii pop
 * - 奶油白底 + 高饱和但甜美的四色点缀（樱花粉 / 天空蓝 / 薰衣草紫 / 香草黄）
 * - 全圆角、泡泡卡片、星星/爱心等装饰元素
 * - 所有字体通过 next/font 注入，这里只声明 family 别名
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 奶油纸张：背景层级
        milk: {
          50: "#fffefc",
          100: "#fff9f3", // 主背景
          200: "#fff0e6", // 次级背景
          300: "#ffe4d1",
        },
        // 主文字：深莓紫，比纯黑更柔和
        plum: {
          50: "#faf5ff",
          100: "#f3e8ff",
          300: "#c084fc",
          500: "#8b5a9f",
          700: "#4a2c5a",
          900: "#2d1b3d", // 主文字色
        },
        // 樱花粉：核心 CTA / 高亮
        sakura: {
          50: "#fff0f6",
          100: "#ffe0ec",
          200: "#ffc2d9",
          300: "#ff9ec0",
          400: "#ff7aa8",
          500: "#ff5b97", // 默认
          600: "#ff3b85",
          700: "#e01f6c",
        },
        // 天空蓝：次级口音
        sky2: {
          100: "#e0f4ff",
          200: "#b3e1ff",
          400: "#5eb4ff",
          500: "#3b99f5",
          600: "#1e7ad1",
        },
        // 薰衣草紫：柔和口音
        lavender: {
          100: "#f0e8ff",
          300: "#c9b3ff",
          500: "#9d7bff",
          700: "#6d4cc5",
        },
        // 香草黄：警示 / 悬赏 / 明亮点缀
        vanilla: {
          100: "#fff8d1",
          300: "#ffe566",
          500: "#ffcc00",
          700: "#d9a500",
        },
        // 薄荷绿：成功/求助辅色
        mint: {
          100: "#d1fae5",
          300: "#6ee7b7",
          500: "#10d49c",
        },
      },
      fontFamily: {
        // 泡泡 Display：Hero 与超大标题，像棉花糖
        pop: ["var(--font-pop)", "sans-serif"],
        // 日系圆体：正文与次级标题
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        // 等宽：元数据
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // 全站圆角阶梯：最小 8，最大 48
        blob: "32px",
        blobby: "48px",
      },
      boxShadow: {
        // 粉色彩色阴影：卡片悬浮感
        sakura: "0 12px 40px -12px rgba(255, 91, 151, 0.45)",
        sakuraSoft: "0 6px 20px -6px rgba(255, 91, 151, 0.25)",
        sky: "0 12px 40px -12px rgba(94, 180, 255, 0.45)",
        lavender: "0 12px 40px -12px rgba(157, 123, 255, 0.45)",
        // 硬边 pop shadow：让按钮像贴纸
        pop: "4px 4px 0 0 #2d1b3d",
        popSakura: "4px 4px 0 0 #ff3b85",
      },
      keyframes: {
        // 首屏入场：弹性上滑
        "bounce-in": {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.96)" },
          "60%": { opacity: "1", transform: "translateY(-4px) scale(1.01)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // 漂浮：装饰元素慢慢上下飘
        float: {
          "0%,100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(3deg)" },
        },
        // 星星一闪一闪
        twinkle: {
          "0%,100%": { opacity: "0.3", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        // 旋转：装饰花朵/星星
        spin_slow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        // 水波摇摆：Hero 底部装饰
        wave: {
          "0%,100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-12px)" },
        },
      },
      animation: {
        "bounce-in": "bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        float: "float 6s ease-in-out infinite",
        twinkle: "twinkle 2.2s ease-in-out infinite",
        spin_slow: "spin_slow 20s linear infinite",
        wave: "wave 8s ease-in-out infinite",
      },
      backgroundImage: {
        // 点阵纹理：卡片背景装饰
        dots: "radial-gradient(circle, #ff9ec0 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
