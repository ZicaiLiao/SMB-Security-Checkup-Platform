import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAppSession, ACTIVE_TENANT_COOKIE } from "@/lib/session";

const schema = z.object({
  tenantId: z.string().min(1)
});

export async function POST(request: Request) {
  const session = await requireAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = schema.parse(await request.json());
  const allowed = session.user.memberships.some((membership) => membership.tenantId === payload.tenantId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACTIVE_TENANT_COOKIE, payload.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}
