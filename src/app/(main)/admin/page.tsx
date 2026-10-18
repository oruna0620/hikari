import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/infrastructure/db/client";
import { companySettings, users, taxSettings } from "@/infrastructure/db/schema";
import { AdminClient } from "./admin-client";

export const metadata = { title: "管理者ページ | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [companyRows, userRows, taxRows] = await Promise.all([
    db.select().from(companySettings).limit(1),
    db.select().from(users),
    db.select().from(taxSettings).limit(1),
  ]);

  return (
    <AdminClient
      company={companyRows[0] ?? null}
      users={userRows}
      tax={taxRows[0] ?? null}
    />
  );
}
