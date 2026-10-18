import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "admin") redirect("/");
  return session;
}
