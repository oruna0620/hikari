import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession, createSession } from "@/lib/auth/session";
import { repositories } from "@/lib/di/container";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { displayName, currentPassword, newPassword } =
      await request.json();

    const user = await repositories.user.findById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // Update password if requested
    if (currentPassword && newPassword) {
      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "現在のパスワードが正しくありません" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "新しいパスワードは6文字以上で入力してください" },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await repositories.user.update(user.id, { passwordHash });
    }

    // Update display name if requested
    if (displayName !== undefined) {
      const trimmed = displayName.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "表示名を入力してください" },
          { status: 400 }
        );
      }

      await repositories.user.update(user.id, { displayName: trimmed });

      // Refresh session cookie with updated display name
      await createSession({
        userId: session.userId,
        username: session.username,
        displayName: trimmed,
        role: session.role,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "更新処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
