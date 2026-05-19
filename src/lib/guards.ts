import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { resolveCurrentTenant } from "@/lib/session";
import { roleCanEdit } from "@/lib/utils";

export async function requireTenantAccess(options?: { requireEdit?: boolean }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const tenantMembership = await resolveCurrentTenant(session);
  if (!tenantMembership) {
    return { error: NextResponse.json({ error: "No tenant membership found" }, { status: 403 }) };
  }
  if (options?.requireEdit && !roleCanEdit(tenantMembership.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    session,
    tenantMembership
  };
}
