import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAssessmentDashboard, getReportByIdForTenants } from "@/lib/repository";
import { buildReportPdf } from "@/lib/report";
import { requireAppSession } from "@/lib/session";

import { GET } from "./route";

vi.mock("@/lib/session", () => ({
  requireAppSession: vi.fn()
}));

vi.mock("@/lib/repository", () => ({
  getAssessmentDashboard: vi.fn(),
  getReportByIdForTenants: vi.fn()
}));

vi.mock("@/lib/report", () => ({
  buildReportPdf: vi.fn()
}));

describe("GET /api/reports/[reportId]/pdf", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads the report through the user's memberships instead of the active tenant cookie", async () => {
    vi.mocked(requireAppSession).mockResolvedValue({
      user: {
        id: "user-1",
        memberships: [
          { tenantId: "tenant-b", role: "ADMIN" },
          { tenantId: "tenant-a", role: "OWNER" }
        ]
      }
    } as Awaited<ReturnType<typeof requireAppSession>>);

    vi.mocked(getReportByIdForTenants).mockResolvedValue({
      id: "report-1",
      tenantId: "tenant-a",
      assessmentId: "assessment-1",
      snapshotId: "snapshot-1",
      generatedAt: "2026-05-18T00:00:00.000Z",
      snapshot: {
        tenantName: "Acme Studio",
        assessmentTitle: "2026 Q2 网络安全体检",
        totalScore: 82,
        status: "LOW",
        domainScores: {
          account_access: 80,
          device_baseline: 84,
          email_security: 78,
          backup_recovery: 88,
          employee_awareness: 83,
          vendor_collaboration: 79
        },
        findings: [],
        generatedAt: "2026-05-18T00:00:00.000Z"
      }
    });

    vi.mocked(getAssessmentDashboard).mockResolvedValue({
      tenantName: "Acme Studio",
      storageMode: "demo",
      assessment: {
        id: "assessment-1",
        tenantId: "tenant-a",
        title: "2026 Q2 网络安全体检",
        status: "REPORTED",
        sourceMode: "hybrid",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
      },
      answers: [],
      evidences: [],
      findings: [],
      latestSnapshot: null,
      latestReport: null,
      questions: [],
      trainingCampaigns: [],
      phishingSimulations: [],
      history: [],
      comparison: {
        current: null,
        previous: null,
        delta: null
      }
    });

    vi.mocked(buildReportPdf).mockResolvedValue(new Uint8Array([1, 2, 3, 4]));

    const response = await GET(new Request("http://localhost/api/reports/report-1/pdf"), {
      params: { reportId: "report-1" }
    });

    expect(getReportByIdForTenants).toHaveBeenCalledWith("report-1", ["tenant-b", "tenant-a"]);
    expect(getAssessmentDashboard).toHaveBeenCalledWith("tenant-a", "assessment-1");
    expect(buildReportPdf).toHaveBeenCalled();
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe('inline; filename="security-report-report-1.pdf"');
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3, 4]);
  });

  it("returns an attachment when download mode is requested", async () => {
    vi.mocked(requireAppSession).mockResolvedValue({
      user: {
        id: "user-1",
        memberships: [{ tenantId: "tenant-a", role: "OWNER" }]
      }
    } as Awaited<ReturnType<typeof requireAppSession>>);

    vi.mocked(getReportByIdForTenants).mockResolvedValue({
      id: "report-1",
      tenantId: "tenant-a",
      assessmentId: "assessment-1",
      snapshotId: "snapshot-1",
      generatedAt: "2026-05-18T00:00:00.000Z",
      snapshot: {
        tenantName: "Acme Studio",
        assessmentTitle: "2026 Q2 网络安全体检",
        totalScore: 82,
        status: "LOW",
        domainScores: {
          account_access: 80,
          device_baseline: 84,
          email_security: 78,
          backup_recovery: 88,
          employee_awareness: 83,
          vendor_collaboration: 79
        },
        findings: [],
        generatedAt: "2026-05-18T00:00:00.000Z"
      }
    });

    vi.mocked(getAssessmentDashboard).mockResolvedValue({
      tenantName: "Acme Studio",
      storageMode: "demo",
      assessment: {
        id: "assessment-1",
        tenantId: "tenant-a",
        title: "2026 Q2 网络安全体检",
        status: "REPORTED",
        sourceMode: "hybrid",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
      },
      answers: [],
      evidences: [],
      findings: [],
      latestSnapshot: null,
      latestReport: null,
      questions: [],
      trainingCampaigns: [],
      phishingSimulations: [],
      history: [],
      comparison: {
        current: null,
        previous: null,
        delta: null
      }
    });

    vi.mocked(buildReportPdf).mockResolvedValue(new Uint8Array([1, 2, 3, 4]));

    const response = await GET(new Request("http://localhost/api/reports/report-1/pdf?download=1"), {
      params: { reportId: "report-1" }
    });

    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="security-report-report-1.pdf"');
  });

  it("returns 401 when the user is not signed in", async () => {
    vi.mocked(requireAppSession).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/reports/report-1/pdf"), {
      params: { reportId: "report-1" }
    });

    expect(response.status).toBe(401);
    expect(getReportByIdForTenants).not.toHaveBeenCalled();
  });
});
