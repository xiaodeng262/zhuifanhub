import { PrismaClient } from "@prisma/client";

/*
 * Prisma Client 单例
 *
 * 业务动机：Next.js dev 模式下每次文件变更都会触发 HMR 重新载入模块，
 * 如果每次都 new PrismaClient() 会迅速耗尽数据库连接池并在控制台打出警告。
 * 做法参考 Prisma 官方指南：把实例挂到 globalThis，HMR 复用同一个 client。
 * 生产环境不挂 global，走正常单例即可。
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
