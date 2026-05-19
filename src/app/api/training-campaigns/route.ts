import { NextResponse } from "next/server";
import { z } from "zod";

import { createTrainingCampaign, listTrainingCampaigns } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  completion: z.number().min(0).max(100)
});

export async function GET() {
  const access = await requireTenantAccess();
  if ("error" in access) {
    return access.error;
  }
  const campaigns = await listTrainingCampaigns(access.tenantMembership.tenantId);
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  const payload = schema.parse(await request.json());
  const campaign = await createTrainingCampaign(access.tenantMembership.tenantId, payload, access.session.user.id);
  return NextResponse.json({ campaign });
}
