import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/line/verify-token";
import { repositories } from "@/lib/di/container";

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "accessToken is required" },
        { status: 400 }
      );
    }

    const profile = await verifyAccessToken(accessToken);

    const mapping = await repositories.lineUserMapping.findByLineUserId(
      profile.userId
    );

    let currentMapping = mapping;

    if (!currentMapping) {
      // 未紐付けの場合、最初のアクティブユーザーに自動紐付け
      const users = await repositories.user.findAll();
      if (users.length === 0) {
        return NextResponse.json(
          { error: "システムにユーザーが存在しません" },
          { status: 403 }
        );
      }

      currentMapping = await repositories.lineUserMapping.upsert({
        lineUserId: profile.userId,
        userId: users[0].id,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });
    }

    const user = await repositories.user.findById(currentMapping.userId);

    return NextResponse.json({
      linked: true,
      userId: currentMapping.userId,
      displayName: user?.displayName ?? profile.displayName,
      lineUserId: profile.userId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
