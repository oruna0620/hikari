"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  users,
  companySettings,
  taxSettings,
} from "@/infrastructure/db/schema";
import { hashPassword } from "@/lib/auth/password";

// ── Company Settings ──

export async function upsertCompanySettings(data: {
  companyName: string;
  postalCode?: string | null;
  address?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  registrationNumber?: string | null;
  bankInfo?: string | null;
  estimateNotes?: string | null;
}) {
  const existing = await db.select().from(companySettings).limit(1);

  if (existing.length > 0) {
    await db
      .update(companySettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companySettings.id, existing[0].id));
  } else {
    await db.insert(companySettings).values({
      companyName: data.companyName,
      postalCode: data.postalCode ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      fax: data.fax ?? null,
      email: data.email ?? null,
      registrationNumber: data.registrationNumber ?? null,
      bankInfo: data.bankInfo ?? null,
      estimateNotes: data.estimateNotes ?? null,
    });
  }

  revalidatePath("/admin");
}

// ── Users ──

export async function createUser(data: {
  username: string;
  displayName: string;
  role: string;
  password: string;
}) {
  const passwordHash = await hashPassword(data.password);

  await db.insert(users).values({
    username: data.username,
    displayName: data.displayName,
    role: data.role,
    passwordHash,
  });

  revalidatePath("/admin");
}

export async function updateUser(
  id: string,
  data: {
    username: string;
    displayName: string;
    role: string;
    isActive: boolean;
    password?: string;
  }
) {
  const updateData: Record<string, unknown> = {
    username: data.username,
    displayName: data.displayName,
    role: data.role,
    isActive: data.isActive,
    updatedAt: new Date(),
  };

  if (data.password && data.password.length > 0) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  revalidatePath("/admin");
}

// ── Tax Settings ──

export async function upsertTaxSettings(data: {
  taxRate: string;
  roundingMethod: string;
  displayMode: string;
  effectiveFrom: string;
}) {
  const existing = await db.select().from(taxSettings).limit(1);

  if (existing.length > 0) {
    await db
      .update(taxSettings)
      .set(data)
      .where(eq(taxSettings.id, existing[0].id));
  } else {
    await db.insert(taxSettings).values(data);
  }

  revalidatePath("/admin");
}
