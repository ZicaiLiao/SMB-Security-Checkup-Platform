import { NextResponse } from "next/server";
import { z } from "zod";

import { getAssessmentById, updateAssessment } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

const schema = z.object({
  title: z.string().min(2).optional(),
  status: z.enum(["DRAFT", "COLLECTING", "SCORED", "REPORTED", "ARCHIVED"]).optional()
});

export async function GET(_request: Request, { params }: { params: { assessmentId: string } }) {
  const access = await requireTenantAccess();
  if ("error" in access) {
    return access.error;
  }
  const assessment = await getAssessmentById(access.tenantMembership.tenantId, params.assessmentId);
  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ assessment });
}

export async function PATCH(request: Request, { params }: { params: { assessmentId: string } }) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  const payload = schema.parse(await request.json());
  const assessment = await updateAssessment(access.tenantMembership.tenantId, params.assessmentId, payload, access.session.user.id);
  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ assessment });
}
