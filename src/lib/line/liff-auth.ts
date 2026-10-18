import { verifyAccessToken } from "./verify-token";
import { repositories } from "@/lib/di/container";

type ResolvedUser = {
  userId: string;
  lineUserId: string;
  displayName: string;
};

export async function resolveUserFromLiffToken(
  accessToken: string
): Promise<ResolvedUser> {
  const profile = await verifyAccessToken(accessToken);

  let mapping = await repositories.lineUserMapping.findByLineUserId(
    profile.userId
  );

  if (!mapping) {
    // 未紐付けの場合、最初のアクティブユーザーに自動紐付け
    const users = await repositories.user.findAll();
    if (users.length === 0) {
      throw new Error("システムにユーザーが存在しません");
    }

    mapping = await repositories.lineUserMapping.upsert({
      lineUserId: profile.userId,
      userId: users[0].id,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    });
  }

  return {
    userId: mapping.userId,
    lineUserId: profile.userId,
    displayName: profile.displayName,
  };
}
