"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function SignInForm() {
  const [email, setEmail] = useState("owner@acme-ops.test");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  function fillDemoAccount(type: "owner" | "admin") {
    if (type === "owner") {
      setEmail("owner@acme-ops.test");
      setPassword("Password123!");
      return;
    }
    setEmail("security.admin@example.com");
    setPassword("Admin123!");
  }

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
      <div className="rounded-3xl bg-slate-100 p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">快速填充</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => fillDemoAccount("owner")}
            type="button"
          >
            演示企业 Owner
          </button>
          <button
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => fillDemoAccount("admin")}
            type="button"
          >
            平台管理员
          </button>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">邮箱</label>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-ocean" onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" type="email" value={email} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">密码</label>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-ocean"
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">演示环境支持企业 Owner 和平台管理员两类入口。</div>
      </div>
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <button className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "登录中..." : "进入平台"}
      </button>
    </form>
  );
}
