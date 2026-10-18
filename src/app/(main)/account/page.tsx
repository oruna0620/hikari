import { requireAuth } from "@/lib/auth/guards";
import { repositories } from "@/lib/di/container";
import { AccountClient } from "./account-client";

export const metadata = { title: "アカウント設定 | 株式会社光" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAuth();
  const user = await repositories.user.findById(session.userId);

  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }

  return (
    <AccountClient
      username={user.username}
      displayName={user.displayName}
      role={user.role}
    />
  );
}
