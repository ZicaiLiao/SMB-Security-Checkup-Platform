"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      退出登录
    </button>
  );
}
