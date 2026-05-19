"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Membership = {
  tenantId: string;
  role: string;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export function TenantSwitcher({
  activeTenantId,
  memberships,
  tenants
}: {
  activeTenantId: string;
  memberships: Membership[];
  tenants: Tenant[];
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function switchTenant(nextTenantId: string) {
    setPending(true);
    await fetch("/api/session/tenant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tenantId: nextTenantId })
    });
    setPending(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tenant Switch</span>
      <div className="flex flex-wrap gap-2">
        {tenants.map((tenant) => {
          const membership = memberships.find((item) => item.tenantId === tenant.id);
          const active = tenant.id === activeTenantId;
          return (
            <button
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              disabled={pending}
              key={tenant.id}
              onClick={() => switchTenant(tenant.id)}
              type="button"
            >
              {tenant.name} · {membership?.role ?? "VIEWER"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
