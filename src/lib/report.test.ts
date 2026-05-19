import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildReportPdf } from "@/lib/report";

const SYSTEM_CHINESE_FONT_PATH = "/System/Library/Fonts/Supplemental/NotoSansKaithi-Regular.ttf";

describe("buildReportPdf", () => {
  it("renders Chinese content into the exported PDF when the system font is available", async () => {
    if (!existsSync(SYSTEM_CHINESE_FONT_PATH)) {
      return;
    }

    const pdfBytes = await buildReportPdf(
      {
        tenantName: "测试企业",
        storageMode: "demo",
        assessment: {
          id: "assessment-1",
          tenantId: "tenant-1",
          title: "2026 Q2 网络安全体检",
          status: "REPORTED",
          sourceMode: "hybrid",
          createdAt: "2026-05-19T00:00:00.000Z",
          updatedAt: "2026-05-19T00:00:00.000Z"
        },
        answers: [],
        evidences: [],
        findings: [
          {
            id: "finding-1",
            tenantId: "tenant-1",
            assessmentId: "assessment-1",
            domain: "email_security",
            severity: "HIGH",
            title: "邮件域名缺少基础认证",
            impact: "攻击者更容易伪造企业身份发信。",
            recommendation: "补齐 SPF、DKIM 和 DMARC 配置，并建立收敛策略。",
            evidenceRefs: [],
            createdAt: "2026-05-19T00:00:00.000Z"
          }
        ],
        latestSnapshot: {
          id: "snapshot-1",
          tenantId: "tenant-1",
          assessmentId: "assessment-1",
          totalScore: 82,
          domainScores: {
            account_access: 80,
            device_baseline: 84,
            email_security: 78,
            backup_recovery: 88,
            employee_awareness: 83,
            vendor_collaboration: 79
          },
          status: "LOW",
          summary: {
            completedQuestions: 12,
            totalQuestions: 12,
            findingsCount: 1,
            evidenceCount: 0
          },
          createdAt: "2026-05-19T00:00:00.000Z"
        },
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
      },
      "测试企业"
    );

    expect(pdfBytes.length).toBeGreaterThan(20000);
  });
});
