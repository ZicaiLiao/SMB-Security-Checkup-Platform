import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buildReportPdf } from "@/lib/report";
import { getAssessmentDashboard, getReportByIdForTenants } from "@/lib/repository";
import { requireAppSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function ReportDownloadPage({ params }: { params: { reportId: string } }) {
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

  const pdfBytes = await buildReportPdf(dashboard, dashboard.tenantName);
  const exportDir = path.join(process.cwd(), ".local-data", "exports");
  const filename = `security-report-${report.id}.pdf`;
  const absolutePath = path.join(exportDir, filename);
  const relativePath = path.relative(process.cwd(), absolutePath);

  await mkdir(exportDir, { recursive: true });
  await writeFile(absolutePath, Buffer.from(pdfBytes));

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-panel">
          <Link className="text-sm font-semibold text-ocean" href={`/reports/${report.id}`}>
            返回报告预览
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">报告已保存</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {report.snapshot.assessmentTitle} 的 PDF 已在 {formatDate(report.generatedAt)} 导出到本地目录。
          </p>

          <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Saved To</div>
            <div className="mt-3 break-all font-mono text-sm">{relativePath}</div>
            <div className="mt-2 break-all font-mono text-xs text-slate-400">{absolutePath}</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              href={`/reports/${report.id}`}
            >
              返回报告预览
            </Link>
            <a
              className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              href={`/api/reports/${report.id}/pdf`}
              rel="noreferrer"
              target="_blank"
            >
              打开 PDF 原版
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
