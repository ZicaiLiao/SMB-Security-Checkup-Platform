import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { getStorageMode, getUserContext, listAssessments } from "@/lib/repository";
import { storageLabel } from "@/lib/repository-shared";
import { requireAppSession, resolveCurrentTenant } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireAppSession();
  if (!session) {
    redirect("/signin");
  }
  const tenantMembership = await resolveCurrentTenant(session);
  if (!tenantMembership) {
    redirect("/signin");
  }
  const [assessments, storageMode, userContext] = await Promise.all([
    listAssessments(tenantMembership.tenantId),
    getStorageMode(),
    getUserContext(session.user.id)
  ]);
  const latest = assessments[0];

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 rounded-[2rem] bg-white/90 p-6 shadow-panel md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Tenant Workspace</div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">你好，{session.user.name}</h1>
            <p className="mt-2 text-sm text-slate-500">这里展示当前租户的体检任务、最新分数与后续行动。</p>
            <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              当前存储后端：{storageLabel(storageMode ?? "demo")}
            </div>
            {userContext && userContext.tenants.length > 1 ? (
              <div className="mt-4">
                <TenantSwitcher
                  activeTenantId={tenantMembership.tenantId}
                  memberships={userContext.memberships}
                  tenants={userContext.tenants}
                />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {session.user.systemRole === "PLATFORM_ADMIN" ? (
              <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" href="/admin">
                平台后台
              </Link>
            ) : null}
            <LogoutButton />
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard helper="最新任务状态" label="体检任务" value={assessments.length} />
          <MetricCard helper="最近一次报告状态" label="最新分数" value={latest?.status ?? "--"} />
          <MetricCard helper="快速进入最近任务" label="最近任务" value={latest?.title ?? "暂无"} />
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">体检任务列表</h2>
              <p className="mt-1 text-sm text-slate-500">一个企业可以反复做复测，所以体检任务是可持续积累的。</p>
            </div>
            <form action="/api/tenants/current/assessments" method="post">
              <button className="rounded-full bg-ocean px-4 py-2 text-sm font-semibold text-white" type="submit">
                新建体检
              </button>
            </form>
          </div>
          <div className="mt-6 space-y-4">
            {assessments.map((assessment: (typeof assessments)[number]) => (
              <Link className="flex flex-col gap-4 rounded-3xl border border-slate-100 p-5 transition hover:border-slate-200 md:flex-row md:items-center md:justify-between" href={`/assessments/${assessment.id}`} key={assessment.id}>
                <div>
                  <div className="text-lg font-semibold text-slate-900">{assessment.title}</div>
                  <div className="mt-1 text-sm text-slate-500">来源模式：{assessment.sourceMode === "hybrid" ? "问卷 + 接入" : "问卷"}</div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill label={assessment.status} />
                  <span className="text-sm text-slate-500">查看详情</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
