import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";

export const ACTIVE_TENANT_COOKIE = "active_tenant_id";

export async function requireAppSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export function getCurrentTenant(session: NonNullable<Awaited<ReturnType<typeof requireAppSession>>>, preferredTenantId?: string | null) {
  if (preferredTenantId) {
    const matched = session.user.memberships.find((membership) => membership.tenantId === preferredTenantId);
    if (matched) {
      return matched;
    }
  }
  return session.user.memberships[0] ?? null;
}

export function getPreferredTenantId() {
  return cookies().get(ACTIVE_TENANT_COOKIE)?.value ?? null;
}

export async function resolveCurrentTenant(session: NonNullable<Awaited<ReturnType<typeof requireAppSession>>>) {
  const preferredTenantId = getPreferredTenantId();
  return getCurrentTenant(session, preferredTenantId);
}
