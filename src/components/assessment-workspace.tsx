"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { buildRequiredProgress, storageLabel } from "@/lib/repository-shared";
import { AssessmentDashboard, MembershipRecord, Question, TenantRecord } from "@/lib/types";
import { domainLabel } from "@/lib/scoring";
import { ReportDownloadButton } from "@/components/report-download-button";
import { StatusPill } from "@/components/status-pill";
import { TenantSwitcher } from "@/components/tenant-switcher";

function groupedQuestions(questions: Question[]) {
  const groups = new Map<string, Question[]>();
  for (const question of questions) {
    const items = groups.get(question.domain) ?? [];
    items.push(question);
    groups.set(question.domain, items);
  }
  return Array.from(groups.entries());
}

export function AssessmentWorkspace({
  dashboard,
  memberships,
  tenants
}: {
  dashboard: AssessmentDashboard;
  memberships: MembershipRecord[];
  tenants: TenantRecord[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [trainingPending, setTrainingPending] = useState(false);
  const [simulationPending, setSimulationPending] = useState(false);
  const [trainingForm, setTrainingForm] = useState({
    name: "",
    description: "",
    completion: "0"
  });
  const [simulationForm, setSimulationForm] = useState({
    name: "",
    template: "",
    employeeCount: "10",
    submittedCount: "0"
  });
  const answersMap = useMemo(() => {
    return new Map(dashboard.answers.map((answer) => [answer.questionId, answer.value.selectedValue]));
  }, [dashboard.answers]);
  const progress = useMemo(() => buildRequiredProgress(dashboard.questions, dashboard.answers), [dashboard.questions, dashboard.answers]);

  async function saveAnswer(question: Question, selectedValue: string) {
    const selectedOption = question.options.find((option) => option.value === selectedValue);
    if (!selectedOption) {
      return;
    }
    setSaving(question.id);
    await fetch(`/api/assessments/${dashboard.assessment.id}/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        questionId: question.id,
        value: {
          selectedValue,
          selectedLabel: selectedOption.label,
          score: selectedOption.score
        }
      })
    });
    setSaving(null);
    router.refresh();
  }

  async function runAction(action: "integrate" | "score" | "report") {
    setBusyAction(action);
    setActionNotice(null);
    const url =
      action === "integrate"
        ? `/api/assessments/${dashboard.assessment.id}/integrations/google-workspace/connect`
        : action === "score"
          ? `/api/assessments/${dashboard.assessment.id}/score`
          : `/api/assessments/${dashboard.assessment.id}/report`;
    const response = await fetch(url, { method: "POST" });
    let payload: { error?: string } | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      setActionNotice({
        tone: "error",
        text: payload?.error ?? "操作未完成，请稍后重试。"
      });
      setBusyAction(null);
      return;
    }
    setActionNotice({
      tone: "success",
      text:
        action === "report"
          ? "报告已生成，下面可以直接预览或下载。"
          : action === "score"
            ? "评分已更新，当前页面已刷新。"
            : "接入已完成，已回填到当前体检。"
    });
    setBusyAction(null);
    router.refresh();
  }

  async function createRetest() {
    setBusyAction("retest");
    setActionNotice(null);
    const response = await fetch(`/api/assessments/${dashboard.assessment.id}/retest`, { method: "POST" });
    let payload: { error?: string; assessment?: { id: string } } | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok || !payload?.assessment) {
      setActionNotice({
        tone: "error",
        text: payload?.error ?? "复测任务创建失败，请稍后重试。"
      });
      setBusyAction(null);
      return;
    }
    router.push(`/assessments/${payload.assessment.id}`);
    router.refresh();
  }

  async function createTrainingCampaign() {
    setTrainingPending(true);
    await fetch("/api/training-campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: trainingForm.name,
        description: trainingForm.description,
        completion: Number(trainingForm.completion)
      })
    });
    setTrainingPending(false);
    setTrainingForm({ name: "", description: "", completion: "0" });
    router.refresh();
  }

  async function createPhishingSimulation() {
    setSimulationPending(true);
    await fetch("/api/phishing-simulations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: simulationForm.name,
        template: simulationForm.template,
        employeeCount: Number(simulationForm.employeeCount),
        submittedCount: Number(simulationForm.submittedCount)
      })
    });
    setSimulationPending(false);
    setSimulationForm({ name: "", template: "", employeeCount: "10", submittedCount: "0" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-[2rem] bg-white p-6 shadow-panel lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{dashboard.tenantName}</span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{storageLabel(dashboard.storageMode)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950">{dashboard.assessment.title}</h1>
            <StatusPill label={dashboard.latestSnapshot?.status ?? dashboard.assessment.status} />
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            这份体检支持问卷录入与 Google Workspace 样板接入混合评分。先补全六大域问卷，再运行自动打分和报告生成。
          </p>
          {tenants.length > 1 ? (
            <div className="mt-4">
              <TenantSwitcher activeTenantId={dashboard.assessment.tenantId} memberships={memberships} tenants={tenants} />
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
              disabled={busyAction !== null}
              onClick={createRetest}
              type="button"
            >
              {busyAction === "retest" ? "创建中..." : "发起复测"}
            </button>
            <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60" disabled={busyAction !== null} onClick={() => runAction("integrate")} type="button">
              {busyAction === "integrate" ? "接入中..." : "接入 Google Workspace 样板"}
            </button>
            <button className="rounded-full bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60" disabled={busyAction !== null} onClick={() => runAction("score")} type="button">
              {busyAction === "score" ? "评分中..." : "运行评分"}
            </button>
            <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:opacity-60" disabled={busyAction !== null} onClick={() => runAction("report")} type="button">
              {busyAction === "report" ? "生成中..." : dashboard.latestReport ? "重新生成报告" : "生成报告"}
            </button>
          </div>
          {actionNotice ? (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                actionNotice.tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"
              }`}
            >
              {actionNotice.text}
            </div>
          ) : null}
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            必答题完成度 {progress.answeredRequired}/{progress.requiredTotal}
            {progress.missingQuestions.length > 0 ? `，还差 ${progress.missingQuestions.length} 题即可形成完整基线。` : "，当前六大域问卷已全部覆盖。"}
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Overall Score</div>
          <div className="mt-4 text-5xl font-semibold">{dashboard.latestSnapshot?.totalScore ?? "--"}</div>
          <div className="mt-2 text-sm text-slate-300">
            已完成 {dashboard.latestSnapshot?.summary.completedQuestions ?? dashboard.answers.length}/{dashboard.questions.length} 个问题，
            发现 {dashboard.latestSnapshot?.summary.findingsCount ?? dashboard.findings.length} 项重点风险。
          </div>
          {dashboard.latestReport ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="w-full text-xs text-slate-300">
                最近报告生成于 {new Date(dashboard.latestReport.generatedAt).toLocaleString("zh-CN")}
              </div>
              <a
                className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
                href={`/reports/${dashboard.latestReport.id}`}
              >
                预览 PDF
              </a>
              <ReportDownloadButton
                className="inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                reportId={dashboard.latestReport.id}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-panel">
              <div className="text-sm font-medium text-slate-500">与上一轮复测对比</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {dashboard.comparison.delta === null ? "--" : `${dashboard.comparison.delta > 0 ? "+" : ""}${dashboard.comparison.delta}`}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {dashboard.comparison.previous
                  ? `上一轮为 ${dashboard.comparison.previous.title}，总分 ${dashboard.comparison.previous.totalScore ?? "--"}`
                  : "这是当前租户的第一轮体检，还没有历史基线。"}
              </div>
            </div>
            <div className="rounded-[2rem] bg-white p-6 shadow-panel">
              <div className="text-sm font-medium text-slate-500">复测时间线</div>
              <div className="mt-4 space-y-3">
                {dashboard.history.slice(0, 4).map((item) => (
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3" key={item.assessmentId}>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("zh-CN")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{item.totalScore ?? "--"}</div>
                      <div className="text-xs text-slate-500">
                        {item.deltaFromPrevious === null ? "基线" : `${item.deltaFromPrevious > 0 ? "+" : ""}${item.deltaFromPrevious}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] bg-white p-6 shadow-panel">
              <div className="text-sm font-medium text-slate-500">问卷完成度</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {Math.round((progress.answeredRequired / Math.max(progress.requiredTotal, 1)) * 100)}%
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {progress.missingQuestions.length === 0
                  ? "当前体检的必答题已经全部完成，可以直接复测并重新评分。"
                  : `还缺 ${progress.missingQuestions.length} 个必答项，优先补齐后再生成正式报告。`}
              </div>
              {progress.missingQuestions.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {progress.missingQuestions.slice(0, 3).map((question) => (
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600" key={question.id}>
                      {question.prompt}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {groupedQuestions(dashboard.questions).map(([domain, questions]) => (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel" key={domain}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{domainLabel(domain as Question["domain"])}</h2>
                  <p className="mt-1 text-sm text-slate-500">每道题的权重会参与六大域独立评分。</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  域分 {dashboard.latestSnapshot?.domainScores[domain as Question["domain"]] ?? "--"}
                </div>
              </div>
              <div className="space-y-5">
                {questions.map((question) => (
                  <div className="rounded-3xl border border-slate-100 p-5" key={question.id}>
                    <div className="text-sm font-semibold text-slate-900">{question.prompt}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">{question.description}</div>
                    <div className="mt-4 grid gap-3">
                      {question.options.map((option) => {
                        const active = answersMap.get(question.id) === option.value;
                        return (
                          <button
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              active ? "border-ocean bg-teal-50 text-teal-900" : "border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                            key={option.value}
                            onClick={() => saveAnswer(question, option.value)}
                            type="button"
                          >
                            <div className="font-medium">{option.label}</div>
                            <div className="mt-1 text-xs text-slate-500">{option.helpText}</div>
                          </button>
                        );
                      })}
                    </div>
                    {saving === question.id ? <div className="mt-3 text-xs text-slate-400">保存中...</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-950">重点发现</h2>
            <div className="mt-4 space-y-4">
              {dashboard.findings.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有生成发现项，先运行评分即可。</div>
              ) : (
                dashboard.findings.slice(0, 6).map((finding) => (
                  <div className="rounded-3xl border border-slate-100 p-4" key={finding.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{finding.title}</div>
                      <StatusPill label={finding.severity} />
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">{finding.recommendation}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-950">培训与演练</h2>
            <div className="mt-4 grid gap-4">
              <div className="rounded-3xl border border-slate-100 p-4">
                <div className="text-sm font-semibold text-slate-900">新增培训活动</div>
                <div className="mt-3 grid gap-3">
                  <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-ocean" onChange={(event) => setTrainingForm((current) => ({ ...current, name: event.target.value }))} placeholder="例如：季度密码安全培训" value={trainingForm.name} />
                  <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-ocean" onChange={(event) => setTrainingForm((current) => ({ ...current, description: event.target.value }))} placeholder="培训覆盖范围与目标" value={trainingForm.description} />
                  <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-ocean" max="100" min="0" onChange={(event) => setTrainingForm((current) => ({ ...current, completion: event.target.value }))} placeholder="完成度 0-100" type="number" value={trainingForm.completion} />
                  <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={trainingPending || !trainingForm.name || !trainingForm.description} onClick={createTrainingCampaign} type="button">
                    {trainingPending ? "创建中..." : "创建培训活动"}
                  </button>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-100 p-4">
                <div className="text-sm font-semibold text-slate-900">新增钓鱼演练</div>
                <div className="mt-3 grid gap-3">
                  <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-ocean" onChange={(event) => setSimulationForm((current) => ({ ...current, name: event.target.value }))} placeholder="例如：财务付款诱导演练" value={simulationForm.name} />
                  <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-ocean" onChange={(event) => setSimulationForm((current) => ({ ...current, template: event.target.value }))} placeholder="演练模板名称" value={simulationForm.template} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-ocean" min="0" onChange={(event) => setSimulationForm((current) => ({ ...current, employeeCount: event.target.value }))} placeholder="员工总数" type="number" value={simulationForm.employeeCount} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-ocean" min="0" onChange={(event) => setSimulationForm((current) => ({ ...current, submittedCount: event.target.value }))} placeholder="点击/提交人数" type="number" value={simulationForm.submittedCount} />
                  </div>
                  <button className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={simulationPending || !simulationForm.name || !simulationForm.template} onClick={createPhishingSimulation} type="button">
                    {simulationPending ? "创建中..." : "创建钓鱼演练"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {dashboard.trainingCampaigns.map((campaign) => (
                <div className="rounded-2xl bg-slate-50 p-4" key={campaign.id}>
                  <div className="text-sm font-semibold text-slate-900">{campaign.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{campaign.description}</div>
                  <div className="mt-2 text-xs font-medium text-slate-600">完成度 {campaign.completion}%</div>
                </div>
              ))}
              {dashboard.phishingSimulations.map((simulation) => (
                <div className="rounded-2xl bg-amber-50 p-4" key={simulation.id}>
                  <div className="text-sm font-semibold text-slate-900">{simulation.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{simulation.template}</div>
                  <div className="mt-2 text-xs font-medium text-slate-600">
                    {simulation.submittedCount}/{simulation.employeeCount} 名员工点击或提交
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
