import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCheck, ShieldAlert, Siren, TrendingUp } from "lucide-react";

import { ReportDownloadButton } from "@/components/report-download-button";
import { StatusPill } from "@/components/status-pill";
import { domainLabel } from "@/lib/scoring";
import { getAssessmentDashboard, getReportByIdForTenants } from "@/lib/repository";
import { requireAppSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

function scoreTone(score: number) {
  if (score >= 85) {
    return { label: "稳健", bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" };
  }
  if (score >= 70) {
    return { label: "可控", bar: "bg-teal-500", badge: "bg-teal-50 text-teal-700" };
  }
  if (score >= 50) {
    return { label: "需观察", bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
  }
  return { label: "优先整改", bar: "bg-rose-500", badge: "bg-rose-50 text-rose-700" };
}

export default async function ReportPreviewPage({ params }: { params: { reportId: string } }) {
  const session = await requireAppSession();
  if (!session) {
    redirect("/signin");
  }

  const report = await getReportByIdForTenants(
    params.reportId,
    session.user.memberships.map((membership) => membership.tenantId)
  );
  if (!report) {
    notFound();
  }

  const dashboard = await getAssessmentDashboard(report.tenantId, report.assessmentId);
  if (!dashboard) {
    notFound();
  }

  const reportFindings = report.snapshot.findings;
  const totalFindings = reportFindings.length;
  const averageTrainingCompletion =
    dashboard.trainingCampaigns.length === 0
      ? null
      : Math.round(
          dashboard.trainingCampaigns.reduce((sum, campaign) => sum + campaign.completion, 0) / dashboard.trainingCampaigns.length
        );
  const totalSimulationEmployees = dashboard.phishingSimulations.reduce((sum, item) => sum + item.employeeCount, 0);
  const totalSimulationClicks = dashboard.phishingSimulations.reduce((sum, item) => sum + item.submittedCount, 0);
  const phishingRate = totalSimulationEmployees === 0 ? null : Math.round((totalSimulationClicks / totalSimulationEmployees) * 100);
  const topFindings = [...reportFindings].sort((left, right) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, PASS: 4 };
    return severityOrder[left.severity] - severityOrder[right.severity];
  }).slice(0, 3);
  const domainRanking = Object.entries(report.snapshot.domainScores)
    .map(([domain, score]) => ({
      domain,
      score,
      tone: scoreTone(score)
    }))
    .sort((left, right) => right.score - left.score);
  const weakestDomain = domainRanking[domainRanking.length - 1];
  const strongestDomain = domainRanking[0];

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-panel">
          <div>
            <Link className="text-sm font-semibold text-ocean" href={`/assessments/${report.assessmentId}`}>
              返回体检详情
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">报告预览</h1>
            <p className="mt-2 text-sm text-slate-500">
              {report.snapshot.tenantName} · {report.snapshot.assessmentTitle} · 生成于 {formatDate(report.generatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              href={`/assessments/${report.assessmentId}`}
            >
              返回体检工作台
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              href={`/api/reports/${report.id}/pdf`}
              rel="noreferrer"
              target="_blank"
            >
              打开 PDF 原版
            </a>
            <ReportDownloadButton
              className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              reportId={report.id}
            />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-panel">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Executive Summary</div>
            <h2 className="mt-3 text-3xl font-semibold">这份报告适合直接拿去做管理层沟通</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              当前整体分数为 {report.snapshot.totalScore} 分，{weakestDomain ? `最弱环节是 ${domainLabel(weakestDomain.domain as keyof typeof report.snapshot.domainScores)}` : "各域仍需持续观察"}，
              {strongestDomain ? `表现相对最好的是 ${domainLabel(strongestDomain.domain as keyof typeof report.snapshot.domainScores)}` : "建议结合整改动作持续复测"}。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">基线覆盖</div>
                <div className="mt-2 text-2xl font-semibold">{dashboard.latestSnapshot?.summary.completedQuestions ?? dashboard.answers.length}/{dashboard.questions.length}</div>
                <div className="mt-1 text-xs text-slate-300">已纳入本次评分</div>
              </div>
              <div className="rounded-3xl bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">重点风险</div>
                <div className="mt-2 text-2xl font-semibold">{totalFindings}</div>
                <div className="mt-1 text-xs text-slate-300">建议优先跟进</div>
              </div>
              <div className="rounded-3xl bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">演练暴露率</div>
                <div className="mt-2 text-2xl font-semibold">{phishingRate ?? "--"}{phishingRate !== null ? "%" : ""}</div>
                <div className="mt-1 text-xs text-slate-300">按已有钓鱼演练计算</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              整改优先级
            </div>
            <div className="mt-4 space-y-3">
              {topFindings.length === 0 ? (
                <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  当前没有高优先级风险，可以把重点放在制度化复测和员工训练的持续保持。
                </div>
              ) : (
                topFindings.map((finding, index) => (
                  <div className="rounded-3xl border border-slate-100 p-4" key={finding.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">P{index + 1} · {finding.title}</div>
                      <StatusPill label={finding.severity} />
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">{finding.recommendation}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-panel md:col-span-2">
            <div className="text-sm font-medium text-slate-500">总分</div>
            <div className="mt-3 flex items-end gap-4">
              <div className="text-5xl font-semibold text-slate-950">{report.snapshot.totalScore}</div>
              <StatusPill label={report.snapshot.status} />
            </div>
            <div className="mt-3 text-sm text-slate-500">
              本次体检已覆盖 {dashboard.latestSnapshot?.summary.completedQuestions ?? dashboard.answers.length}/{dashboard.questions.length} 个检查项。
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <div className="text-sm font-medium text-slate-500">重点发现</div>
            <div className="mt-3 text-4xl font-semibold text-slate-950">{totalFindings}</div>
            <div className="mt-2 text-sm text-slate-500">
              {totalFindings === 0 ? "当前没有高优先级发现。" : "建议优先处理高风险与中风险项。"}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <div className="text-sm font-medium text-slate-500">培训完成度</div>
            <div className="mt-3 text-4xl font-semibold text-slate-950">{averageTrainingCompletion ?? "--"}{averageTrainingCompletion !== null ? "%" : ""}</div>
            <div className="mt-2 text-sm text-slate-500">
              {dashboard.trainingCampaigns.length === 0 ? "当前没有培训活动记录。" : `${dashboard.trainingCampaigns.length} 个培训活动已纳入报告。`}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <div className="text-sm font-medium text-slate-500">钓鱼暴露率</div>
            <div className="mt-3 text-4xl font-semibold text-slate-950">{phishingRate ?? "--"}{phishingRate !== null ? "%" : ""}</div>
            <div className="mt-2 text-sm text-slate-500">
              {phishingRate === null ? "当前没有演练数据。" : `${totalSimulationClicks}/${totalSimulationEmployees} 名员工点击或提交。`}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">六大域评分</h2>
            <StatusPill label={report.snapshot.status} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domainRanking.map((item) => (
              <div className="rounded-3xl border border-slate-100 p-5" key={item.domain}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-500">{domainLabel(item.domain as keyof typeof report.snapshot.domainScores)}</div>
                  <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone.badge}`}>{item.tone.label}</div>
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">{item.score}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${item.tone.bar}`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-950">重点发现与整改建议</h2>
            <div className="mt-4 space-y-4">
              {reportFindings.length === 0 ? (
                <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                  当前报告没有自动生成重点发现，整体风险水平较低，可继续通过复测保持基线。
                </div>
              ) : (
                reportFindings.map((finding) => (
                  <div className="rounded-3xl border border-slate-100 p-5" key={finding.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{finding.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{domainLabel(finding.domain)}</div>
                      </div>
                      <StatusPill label={finding.severity} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{finding.impact}</p>
                    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{finding.recommendation}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-950">下一轮建议</h2>
              <div className="mt-4 space-y-3">
                <div className="flex gap-3 rounded-3xl bg-slate-50 p-4">
                  <Siren className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <div className="text-sm leading-6 text-slate-600">先处理最弱域和高严重度发现项，优先把高权限账号、邮件域名和备份恢复链路补齐。</div>
                </div>
                <div className="flex gap-3 rounded-3xl bg-slate-50 p-4">
                  <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="text-sm leading-6 text-slate-600">把整改动作绑定到培训活动和钓鱼演练，避免风险只停留在报告结论里。</div>
                </div>
                <div className="flex gap-3 rounded-3xl bg-slate-50 p-4">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
                  <div className="text-sm leading-6 text-slate-600">建议在主要整改完成后发起复测，用同一套评分模型验证进步幅度。</div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-950">培训活动</h2>
              <div className="mt-4 space-y-3">
                {dashboard.trainingCampaigns.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有培训活动记录。</div>
                ) : (
                  dashboard.trainingCampaigns.map((campaign) => (
                    <div className="rounded-2xl bg-slate-50 p-4" key={campaign.id}>
                      <div className="text-sm font-semibold text-slate-900">{campaign.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{campaign.description}</div>
                      <div className="mt-2 text-xs font-medium text-slate-600">完成度 {campaign.completion}%</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-950">钓鱼演练</h2>
              <div className="mt-4 space-y-3">
                {dashboard.phishingSimulations.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有钓鱼演练记录。</div>
                ) : (
                  dashboard.phishingSimulations.map((simulation) => (
                    <div className="rounded-2xl bg-amber-50 p-4" key={simulation.id}>
                      <div className="text-sm font-semibold text-slate-900">{simulation.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{simulation.template}</div>
                      <div className="mt-2 text-xs font-medium text-slate-600">
                        {simulation.submittedCount}/{simulation.employeeCount} 名员工点击或提交
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
