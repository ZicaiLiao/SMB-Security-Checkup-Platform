import { NextResponse } from "next/server";

import { getAssessmentDashboard } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

export async function GET(_request: Request, { params }: { params: { assessmentId: string } }) {
  const access = await requireTenantAccess();
  if ("error" in access) {
    return access.error;
  }
  const dashboard = await getAssessmentDashboard(access.tenantMembership.tenantId, params.assessmentId);
  if (!dashboard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ dashboard });
}
