"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tenantName: ""
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "注册失败。");
      setPending(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false
    });
    setPending(false);
    if (signInResult?.error) {
      setError("账号已创建，但自动登录失败。");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">联系人姓名</label>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-ocean" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">企业名称</label>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-ocean" onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))} value={form.tenantName} />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">邮箱</label>
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-ocean" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" value={form.email} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">密码</label>
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-ocean" onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} type="password" value={form.password} />
      </div>
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <button className="w-full rounded-2xl bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "创建中..." : "创建企业空间"}
      </button>
    </form>
  );
}
