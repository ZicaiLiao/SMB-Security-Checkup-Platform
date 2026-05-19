"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const [email, setEmail] = useState("owner@acme-ops.test");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setPending(false);
    if (result?.error) {
      setError("邮箱或密码不正确。");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">邮箱</label>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-ocean" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">密码</label>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-ocean" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </div>
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <button className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "登录中..." : "进入平台"}
      </button>
    </form>
  );
}
