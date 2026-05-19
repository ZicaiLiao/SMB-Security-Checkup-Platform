import { NextResponse } from "next/server";
import { z } from "zod";

import { createPhishingSimulation, listPhishingSimulations } from "@/lib/repository";
import { requireTenantAccess } from "@/lib/guards";

const schema = z.object({
  name: z.string().min(2),
  template: z.string().min(2),
  employeeCount: z.number().int().nonnegative(),
  submittedCount: z.number().int().nonnegative()
});

export async function GET() {
  const access = await requireTenantAccess();
  if ("error" in access) {
    return access.error;
  }
  const simulations = await listPhishingSimulations(access.tenantMembership.tenantId);
  return NextResponse.json({ simulations });
}

export async function POST(request: Request) {
  const access = await requireTenantAccess({ requireEdit: true });
  if ("error" in access) {
    return access.error;
  }
  const payload = schema.parse(await request.json());
  const simulation = await createPhishingSimulation(access.tenantMembership.tenantId, payload, access.session.user.id);
  return NextResponse.json({ simulation });
}
