import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { repositories } from "@/lib/di/container";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "ユーザー名とパスワードを入力してください" },
        { status: 400 }
      );
    }

    const user = await repositories.user.findByUsername(username);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "ログイン処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
