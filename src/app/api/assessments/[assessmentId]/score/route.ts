import { NextResponse } from "next/server";

import { scoreAssessment } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

export async function POST(_request: Request, { params }: { params: { assessmentId: string } }) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  try {
    const result = await scoreAssessment(access.tenantMembership.tenantId, params.assessmentId, access.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to score" }, { status: 400 });
  }
}
