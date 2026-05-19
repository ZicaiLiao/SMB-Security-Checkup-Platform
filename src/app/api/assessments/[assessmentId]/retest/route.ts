import { NextResponse } from "next/server";

import { requireTenantAccess } from "@/lib/guards";
import { createRetestAssessment } from "@/lib/repository";

export async function POST(_request: Request, { params }: { params: { assessmentId: string } }) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }

  try {
    const assessment = await createRetestAssessment(
      access.tenantMembership.tenantId,
      params.assessmentId,
      access.session.user.id
    );

    if (!assessment) {
      return NextResponse.json({ error: "Unable to create retest assessment" }, { status: 500 });
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create retest assessment" }, { status: 400 });
  }
}
