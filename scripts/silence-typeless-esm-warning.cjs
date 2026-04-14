// 预加载脚本：抑制 Next.js dev 启动 /login 编译时 Node 22 抛出的
// MODULE_TYPELESS_PACKAGE_JSON 警告（"To load an ES module, set type: module..."）。
//
// 业务背景：Tailwind 的 loadConfig 通过 require() 加载我们的 tailwind.config.ts，
// 会顺带触发 next/dist/** 下若干含顶层 import/export 的 .js 文件被 require()，
// 而 next 包的 package.json 没有 "type" 字段，命中 Node 22 的 typeless ESM
// 自动检测路径并抛出此警告。
//
// 关键约束：该警告在 Node 22.2 中走的是 emitWarningSync —— 直接 console.error
// 写 stderr，既不带 code/name（无法 --disable-warning 精准屏蔽），又绕过
// process.emitWarning（无法在 emitWarning 上做 hook）。唯一可控的拦截点是
// stderr.write 本身。这里只丢弃这一条特定文本及其紧跟的 trace 提示行，
// 其它任何 stderr 输出（含其它警告与错误）仍原样透传，避免误伤。
const TARGET = 'To load an ES module, set "type": "module"';
const TRACE_HINT = "Use `node --trace-warnings ...`";

const origWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function patchedStderrWrite(chunk, ...rest) {
  const text = typeof chunk === "string" ? chunk : chunk && chunk.toString ? chunk.toString() : "";
  if (text && (text.includes(TARGET) || text.includes(TRACE_HINT))) {
    if (typeof rest[rest.length - 1] === "function") rest[rest.length - 1]();
    return true;
  }
  return origWrite(chunk, ...rest);
};
