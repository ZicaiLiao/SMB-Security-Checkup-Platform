import { redirect } from "next/navigation";
import { Activity, Building2, FileWarning, Radar } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { listAuditEventsForAdmin, listTenantsForAdmin, getStorageMode } from "@/lib/repository";
import { formatDate } from "@/lib/utils";
import { requireAppSession } from "@/lib/session";
import { storageLabel } from "@/lib/repository-shared";

function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    "tenant-created": "创建企业空间",
    "assessment-created": "创建体检任务",
    "assessment-retested": "发起复测",
    "answer-upserted": "更新问卷答案",
    "integration-connected": "完成系统接入",
    "assessment-scored": "运行评分",
    "report-created": "生成报告",
    "training-campaign-created": "创建培训活动",
    "phishing-simulation-created": "创建钓鱼演练"
  };
  return labels[action] ?? action;
}

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
  const tenantsWithReports = tenants.filter((item) => item.latestReportAt).length;
  const averageLatestScore = (() => {
    const items = tenants.filter((item) => item.latestScore !== null);
    if (items.length === 0) {
      return null;
    }
    return Math.round(items.reduce((sum, item) => sum + (item.latestScore ?? 0), 0) / items.length);
  })();
  const attentionTenants = tenants
    .filter((item) => item.latestScore === null || (item.latestScore ?? 100) < 60)
    .sort((left, right) => (left.latestScore ?? -1) - (right.latestScore ?? -1))
    .slice(0, 3);

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-6 rounded-[2rem] bg-white p-6 shadow-panel lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Platform Admin</div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">运营后台</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">这里不只是看租户数量，而是用来判断平台是否在持续产生活跃体检、正式报告和后续复测。</p>
            <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              当前存储后端：{storageLabel(storageMode ?? "demo")}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <div className="text-sm uppercase tracking-[0.18em] text-slate-400">Platform Health</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-3xl font-semibold">{averageLatestScore ?? "--"}</div>
                <div className="mt-1 text-sm text-slate-300">租户平均最新分数</div>
              </div>
              <div>
                <div className="text-3xl font-semibold">{tenantsWithReports}/{tenants.length}</div>
                <div className="mt-1 text-sm text-slate-300">已有正式报告的租户</div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <MetricCard helper="当前累计企业数" label="租户" value={tenants.length} />
          <MetricCard helper="总任务数" label="体检任务" value={tenants.reduce((sum, tenant) => sum + tenant.assessments, 0)} />
          <MetricCard helper="最近一份报告" label="最新报告" value={latestReportAt ? formatDate(latestReportAt) : "暂无"} />
          <MetricCard helper="需要优先跟进的企业数" label="待关注租户" value={attentionTenants.length} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <FileWarning className="h-5 w-5 text-amber-500" />
              需要优先关注
            </div>
            <div className="mt-4 space-y-3">
              {attentionTenants.length === 0 ? (
                <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">当前所有租户都已有报告且分数未落入高风险区间。</div>
              ) : (
                attentionTenants.map((tenant) => (
                  <div className="rounded-3xl border border-slate-100 p-4" key={tenant.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{tenant.name}</div>
                      <StatusPill label={tenant.latestScore !== null && tenant.latestScore >= 60 ? "LOW" : "HIGH"} />
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {tenant.latestReportAt
                        ? `最近报告：${formatDate(tenant.latestReportAt)} · 最新分数 ${tenant.latestScore ?? "--"}`
                        : "尚未形成正式报告，建议优先推动完成首份交付。"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <Radar className="h-5 w-5 text-ocean" />
              平台运营信号
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">报告覆盖率</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {tenants.length === 0 ? 0 : Math.round((tenantsWithReports / tenants.length) * 100)}%
                </div>
                <div className="mt-1 text-sm text-slate-500">衡量租户是否真正走到了可交付阶段。</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">平均任务密度</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {tenants.length === 0 ? 0 : (tenants.reduce((sum, tenant) => sum + tenant.assessments, 0) / tenants.length).toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-slate-500">可用来观察复测是否发生，而不是只做一次性评估。</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-panel">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-950">
            <Building2 className="h-5 w-5 text-slate-700" />
            租户总览
          </div>
          <div className="mt-6 grid gap-4 lg:hidden">
            {tenants.map((tenant) => (
              <div className="rounded-3xl border border-slate-100 p-4" key={tenant.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">{tenant.name}</div>
                  <StatusPill label={tenant.latestScore !== null && tenant.latestScore >= 70 ? "PASS" : tenant.latestScore !== null && tenant.latestScore >= 50 ? "MEDIUM" : "HIGH"} />
                </div>
                <div className="mt-2 text-sm text-slate-500">{tenant.slug}</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">任务</div>
                    <div className="mt-1 font-semibold text-slate-900">{tenant.assessments}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">最新分数</div>
                    <div className="mt-1 font-semibold text-slate-900">{tenant.latestScore ?? "--"}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-500">{tenant.latestReportAt ? formatDate(tenant.latestReportAt) : "暂无正式报告"}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-100 lg:block">
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
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-950">
            <Activity className="h-5 w-5 text-slate-700" />
            最近审计事件
          </div>
          <div className="mt-6 space-y-3">
            {auditEvents.map((event) => (
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between" key={event.id}>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{auditActionLabel(event.action)}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {event.tenantName ?? "平台级"} · {event.actorName ?? "系统"} · {formatDate(event.createdAt)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(event.meta).map(([key, value]) => (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500" key={`${event.id}-${key}`}>
                        {key}: {value}
                      </span>
                    ))}
                  </div>
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
