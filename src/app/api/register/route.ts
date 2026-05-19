import { NextResponse } from "next/server";
import { z } from "zod";

import { registerOwner } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(2)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await registerOwner(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "请检查输入是否完整。" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "该邮箱已经注册。" }, { status: 409 });
    }
    return NextResponse.json({ error: "注册失败，请稍后再试。" }, { status: 500 });
  }
}
