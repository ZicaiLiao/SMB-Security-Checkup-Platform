import { NextResponse } from "next/server";

import { connectGoogleWorkspace } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

export async function POST(_request: Request, { params }: { params: { assessmentId: string; provider: string } }) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  if (params.provider !== "google-workspace") {
    return NextResponse.json({ error: "Provider not supported in MVP" }, { status: 400 });
  }
  const evidences = await connectGoogleWorkspace(access.tenantMembership.tenantId, params.assessmentId, access.session.user.id);
  return NextResponse.json({ evidences });
}
