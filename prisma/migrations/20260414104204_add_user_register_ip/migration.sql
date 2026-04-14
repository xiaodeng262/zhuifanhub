-- AlterTable
-- 业务动机：限制"同一 IP 反复注册"的反滥用策略；可空字段保持对历史数据与 seed 用户兼容
ALTER TABLE "User" ADD COLUMN "registerIp" TEXT;

-- CreateIndex
-- 注册接口需按 IP 查"是否已被占用"，加索引避免随用户量增长退化成全表扫描
CREATE INDEX "User_registerIp_idx" ON "User"("registerIp");
