import { prisma } from "@/lib/db";

/*
 * 关注关系存储层（Prisma 版）
 *
 * 表结构：复合主键 (followerId, followeeId)
 * 业务规则：自关注由 API 层提前拦截；store 层只做去重 + 幂等
 */

export async function isFollowing(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  if (!followerId || !followeeId) return false;
  const row = await prisma.follow.findUnique({
    where: { followerId_followeeId: { followerId, followeeId } },
  });
  return row !== null;
}

/*
 * 关注用户
 * 幂等：upsert 保证重复调用不报错
 */
export async function follow(
  followerId: string,
  followeeId: string
): Promise<void> {
  await prisma.follow.upsert({
    where: { followerId_followeeId: { followerId, followeeId } },
    update: {},
    create: { followerId, followeeId },
  });
}

/*
 * 取消关注
 * 幂等：deleteMany 吃不存在
 */
export async function unfollow(
  followerId: string,
  followeeId: string
): Promise<void> {
  await prisma.follow.deleteMany({
    where: { followerId, followeeId },
  });
}

/*
 * 粉丝数：多少人关注了此用户
 */
export async function followerCount(userId: string): Promise<number> {
  return prisma.follow.count({ where: { followeeId: userId } });
}
