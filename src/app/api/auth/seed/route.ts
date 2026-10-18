import { NextResponse } from "next/server";
import { db } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

// Seed an admin user — call once via: POST /api/auth/seed
export async function POST() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, "admin"));

  if (existing.length > 0) {
    return NextResponse.json({ message: "Admin user already exists" });
  }

  const hash = await hashPassword("admin123");

  await db.insert(users).values({
    username: "admin",
    passwordHash: hash,
    displayName: "管理者",
    role: "admin",
  });

  return NextResponse.json({
    message: "Admin user created",
    username: "admin",
    password: "admin123",
  });
}
