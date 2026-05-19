import { NextResponse } from "next/server";

import { createReport } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

export async function POST(_request: Request, { params }: { params: { assessmentId: string } }) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  try {
    const report = await createReport(access.tenantMembership.tenantId, params.assessmentId, access.session.user.id);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create report" }, { status: 400 });
  }
}
