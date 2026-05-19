import { redirect } from "next/navigation";

import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { listAuditEventsForAdmin, listTenantsForAdmin, getStorageMode } from "@/lib/repository";
import { formatDate } from "@/lib/utils";
import { requireAppSession } from "@/lib/session";
import { storageLabel } from "@/lib/repository-shared";

export default async function AdminPage() {
  const session = await requireAppSession();
  if (!session) {
    redirect("/signin");
  }
  if (session.user.systemRole !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  const [tenants, auditEvents, storageMode] = await Promise.all([
    listTenantsForAdmin(),
    listAuditEventsForAdmin(12),
    getStorageMode()
  ]);
  const latestReportAt = tenants.find((item) => item.latestReportAt)?.latestReportAt;

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] bg-white p-6 shadow-panel">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Platform Admin</div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">运营后台</h1>
          <p className="mt-2 text-sm text-slate-500">用来查看租户数量、体检活跃度和报告生成情况。</p>
          <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            当前存储后端：{storageLabel(storageMode ?? "demo")}
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard helper="当前累计企业数" label="租户" value={tenants.length} />
          <MetricCard helper="总任务数" label="体检任务" value={tenants.reduce((sum, tenant) => sum + tenant.assessments, 0)} />
          <MetricCard helper="最近一份报告" label="最新报告" value={latestReportAt ? formatDate(latestReportAt) : "暂无"} />
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-panel">
          <h2 className="text-xl font-semibold text-slate-950">租户总览</h2>
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">企业</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">体检任务</th>
                  <th className="px-4 py-3 font-medium">最新报告</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-4 py-4 font-medium">{tenant.name}</td>
                    <td className="px-4 py-4 text-slate-500">{tenant.slug}</td>
                    <td className="px-4 py-4">{tenant.assessments}</td>
                    <td className="px-4 py-4 text-slate-500">
                      {tenant.latestReportAt ? `${formatDate(tenant.latestReportAt)} / 分数 ${tenant.latestScore ?? "--"}` : "暂无"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-panel">
          <h2 className="text-xl font-semibold text-slate-950">最近审计事件</h2>
          <div className="mt-6 space-y-3">
            {auditEvents.map((event) => (
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between" key={event.id}>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{event.action}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {event.tenantName ?? "平台级"} · {event.actorName ?? "系统"} · {formatDate(event.createdAt)}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{Object.entries(event.meta).map(([key, value]) => `${key}: ${value}`).join(" · ")}</div>
                </div>
                <StatusPill label={event.tenantName ? "TENANT" : "SYSTEM"} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
