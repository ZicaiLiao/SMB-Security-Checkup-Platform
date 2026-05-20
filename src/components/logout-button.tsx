"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:opacity-60"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signOut({ callbackUrl: "/" });
      }}
      type="button"
    >
      {pending ? "退出中..." : "退出登录"}
    </button>
  );
}
