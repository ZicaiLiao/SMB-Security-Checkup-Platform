import { NextResponse } from "next/server";

import { buildReportPdf } from "@/lib/report";
import { getAssessmentDashboard, getReportByIdForTenants } from "@/lib/repository";
import { requireAppSession } from "@/lib/session";

export async function GET(request: Request, { params }: { params: { reportId: string } }) {
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

  const download = new URL(request.url).searchParams.get("download") === "1";
  const pdfBytes = await buildReportPdf(dashboard, dashboard.tenantName);
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="security-report-${report.id}.pdf"`
    }
  });
}
