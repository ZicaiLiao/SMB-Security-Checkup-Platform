import { NextResponse } from "next/server";
import { z } from "zod";

import { upsertAnswer } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

const schema = z.object({
  questionId: z.string(),
  value: z.object({
    selectedValue: z.string(),
    selectedLabel: z.string(),
    score: z.number()
  })
});

export async function POST(request: Request, { params }: { params: { assessmentId: string } }) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  const payload = schema.parse(await request.json());
  const answer = await upsertAnswer(access.tenantMembership.tenantId, params.assessmentId, payload.questionId, payload.value, access.session.user.id);
  return NextResponse.json({ answer });
}
