import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock3, FileCheck2, ShieldAlert } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { getAssessmentDashboard, getStorageMode, getUserContext, listAssessments } from "@/lib/repository";
import { buildRequiredProgress, storageLabel } from "@/lib/repository-shared";
import { requireAppSession, resolveCurrentTenant } from "@/lib/session";
import { formatDate } from "@/lib/utils";

function buildNextStep(input: {
  latestSnapshot: number | null;
  reportId: string | null;
  missingRequired: number;
}) {
  if (input.missingRequired > 0) {
    return {
      label: "补齐问卷基线",
      helper: `还有 ${input.missingRequired} 个必答项待完成`
    };
  }
  if (input.latestSnapshot === null) {
    return {
      label: "运行首次评分",
      helper: "问卷已可用，下一步可以生成风险分数"
    };
  }
  if (!input.reportId) {
    return {
      label: "生成正式报告",
      helper: "已有分数，但还没有形成可交付报告"
    };
  }
  return {
    label: "安排复测节奏",
    helper: "当前体检已形成闭环，可以进入整改追踪"
  };
}

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
  const assessmentSummaries = await Promise.all(
    assessments.map(async (assessment: (typeof assessments)[number]) => {
      const dashboard = await getAssessmentDashboard(tenantMembership.tenantId, assessment.id);
      if (!dashboard) {
        return {
          assessment,
          latestSnapshot: null,
          latestReport: null,
          findingsCount: 0,
          progressPercent: 0,
          missingRequired: 0
        };
      }

      const progress = buildRequiredProgress(dashboard.questions, dashboard.answers);
      return {
        assessment,
        latestSnapshot: dashboard.latestSnapshot,
        latestReport: dashboard.latestReport,
        findingsCount: dashboard.findings.length,
        progressPercent: Math.round((progress.answeredRequired / Math.max(progress.requiredTotal, 1)) * 100),
        missingRequired: progress.missingQuestions.length
      };
    })
  );

  const latest = assessmentSummaries[0] ?? null;
  const nextStep = buildNextStep({
    latestSnapshot: latest?.latestSnapshot?.totalScore ?? null,
    reportId: latest?.latestReport?.id ?? null,
    missingRequired: latest?.missingRequired ?? 0
  });

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 rounded-[2rem] bg-white/90 p-6 shadow-panel md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Tenant Workspace</div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">你好，{session.user.name}</h1>
            <p className="mt-2 text-sm text-slate-500">这里不只是体检列表，更是当前租户的安全改进驾驶舱。</p>
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
          <MetricCard helper={latest?.latestSnapshot ? "最近一次评分结果" : "最新任务尚未评分"} label="最新分数" value={latest?.latestSnapshot ? `${latest.latestSnapshot.totalScore} 分` : "待评分"} />
          <MetricCard helper={nextStep.helper} label="当前优先动作" value={nextStep.label} />
        </section>

        {latest ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Current Focus</div>
                  <h2 className="mt-2 text-3xl font-semibold">{latest.assessment.title}</h2>
                </div>
                <StatusPill label={latest.latestSnapshot?.status ?? latest.assessment.status} />
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                {latest.missingRequired > 0
                  ? `这份体检还差 ${latest.missingRequired} 个必答项，建议先把基线补齐，再运行评分和报告。`
                  : latest.latestSnapshot
                    ? "问卷基线已经成型，可以基于当前分数与重点风险安排整改和复测节奏。"
                    : "问卷已具备进入评分的条件，下一步建议直接生成分数并确认高优先级风险。"}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" href={`/assessments/${latest.assessment.id}`}>
                  进入当前体检
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {latest.latestReport ? (
                  <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/35" href={`/reports/${latest.latestReport.id}`}>
                    查看最新报告
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  风险与分数
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div className="text-4xl font-semibold text-slate-950">{latest.latestSnapshot?.totalScore ?? "--"}</div>
                  <div className="text-right text-sm text-slate-500">{latest.findingsCount} 项重点发现</div>
                </div>
              </div>
              <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <FileCheck2 className="h-4 w-4 text-ocean" />
                  报告进度
                </div>
                <div className="mt-4 text-lg font-semibold text-slate-950">
                  {latest.latestReport ? "已生成正式报告" : "尚未生成正式报告"}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {latest.latestReport ? `最近生成于 ${formatDate(latest.latestReport.generatedAt)}` : "完成评分后即可输出给客户的标准化报告。"}
                </div>
              </div>
              <div className="rounded-[2rem] bg-white p-5 shadow-panel">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  问卷完成度
                </div>
                <div className="mt-4 text-lg font-semibold text-slate-950">{latest.progressPercent}%</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-ocean" style={{ width: `${latest.progressPercent}%` }} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">体检任务列表</h2>
              <p className="mt-1 text-sm text-slate-500">一个企业可以反复做复测，所以任务列表应该同时体现阶段、进展和可交付状态。</p>
            </div>
            <form action="/api/tenants/current/assessments" method="post">
              <button className="rounded-full bg-ocean px-4 py-2 text-sm font-semibold text-white" type="submit">
                新建体检
              </button>
            </form>
          </div>
          <div className="mt-6 space-y-4">
            {assessmentSummaries.map((summary) => (
              <Link className="block rounded-3xl border border-slate-100 p-5 transition hover:border-slate-200 hover:shadow-panel" href={`/assessments/${summary.assessment.id}`} key={summary.assessment.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-lg font-semibold text-slate-900">{summary.assessment.title}</div>
                      <StatusPill label={summary.latestSnapshot?.status ?? summary.assessment.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>来源模式：{summary.assessment.sourceMode === "hybrid" ? "问卷 + 接入" : "问卷"}</span>
                      <span>创建于：{formatDate(summary.assessment.createdAt)}</span>
                      <span>{summary.latestReport ? "已有正式报告" : "尚未生成报告"}</span>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3 lg:min-w-[23rem]">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Score</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{summary.latestSnapshot?.totalScore ?? "--"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Progress</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{summary.progressPercent}%</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Findings</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{summary.findingsCount}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-ocean" style={{ width: `${summary.progressPercent}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
