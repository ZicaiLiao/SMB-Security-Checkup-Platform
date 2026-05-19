import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { buildReportPdf } from "@/lib/report";
import { getAssessmentDashboard, getReportByIdForTenants } from "@/lib/repository";
import { requireAppSession } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: { reportId: string } }) {
  const session = await requireAppSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getReportByIdForTenants(
    params.reportId,
    session.user.memberships.map((membership) => membership.tenantId)
  );
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dashboard = await getAssessmentDashboard(report.tenantId, report.assessmentId);
  if (!dashboard) {
    return NextResponse.json({ error: "Report data incomplete" }, { status: 400 });
  }

  const pdfBytes = await buildReportPdf(dashboard, dashboard.tenantName);
  const exportDir = path.join(process.cwd(), ".local-data", "exports");
  const filename = `security-report-${report.id}.pdf`;
  const absolutePath = path.join(exportDir, filename);

  await mkdir(exportDir, { recursive: true });
  await writeFile(absolutePath, Buffer.from(pdfBytes));

  return NextResponse.json({
    ok: true,
    filename,
    absolutePath,
    relativePath: path.relative(process.cwd(), absolutePath)
  });
}
