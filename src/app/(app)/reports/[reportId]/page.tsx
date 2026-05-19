import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ReportDownloadButton } from "@/components/report-download-button";
import { StatusPill } from "@/components/status-pill";
import { domainLabel } from "@/lib/scoring";
import { getAssessmentDashboard, getReportByIdForTenants } from "@/lib/repository";
import { requireAppSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

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
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">六大域评分</h2>
            <StatusPill label={report.snapshot.status} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(report.snapshot.domainScores).map(([domain, score]) => (
              <div className="rounded-3xl border border-slate-100 p-5" key={domain}>
                <div className="text-sm font-medium text-slate-500">{domainLabel(domain as keyof typeof report.snapshot.domainScores)}</div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">{score}</div>
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
