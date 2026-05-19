import { NextResponse } from "next/server";

import { createAssessment, listAssessments } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

export async function GET() {
  const access = await requireTenantAccess();
  if ("error" in access) {
    return access.error;
  }
  const assessments = await listAssessments(access.tenantMembership.tenantId);
  return NextResponse.json({ assessments });
}

export async function POST() {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  const title = `${new Date().getFullYear()} 复测体检`;
  const assessment = await createAssessment(access.tenantMembership.tenantId, title, access.session.user.id);
  if (!assessment) {
    return NextResponse.json({ error: "Unable to create assessment" }, { status: 500 });
  }
  return NextResponse.redirect(new URL(`/assessments/${assessment.id}`, process.env.NEXTAUTH_URL ?? "http://localhost:3000"), 303);
}
