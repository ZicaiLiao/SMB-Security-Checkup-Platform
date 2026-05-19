import { describe, expect, it } from "vitest";

import { QUESTION_BANK } from "@/lib/question-bank";
import { computeAssessmentScore } from "@/lib/scoring";

describe("computeAssessmentScore", () => {
  it("keeps a strong score when answers are healthy", () => {
    const answers = QUESTION_BANK.map((question, index) => ({
      id: `answer-${index}`,
      tenantId: "tenant-1",
      assessmentId: "assessment-1",
      questionId: question.id,
      value: {
        selectedValue: question.options[0].value,
        selectedLabel: question.options[0].label,
        score: question.options[0].score
      },
      updatedAt: new Date().toISOString()
    }));

    const result = computeAssessmentScore({
      assessmentId: "assessment-1",
      tenantId: "tenant-1",
      answers,
      evidences: []
    });

    expect(result.snapshot.totalScore).toBeGreaterThanOrEqual(95);
    expect(result.snapshot.status).toBe("PASS");
  });

  it("derives findings from weak evidence and weak controls", () => {
    const answers = QUESTION_BANK.map((question, index) => ({
      id: `answer-${index}`,
      tenantId: "tenant-2",
      assessmentId: "assessment-2",
      questionId: question.id,
      value: {
        selectedValue: question.options[2]?.value ?? question.options[1].value,
        selectedLabel: question.options[2]?.label ?? question.options[1].label,
        score: question.options[2]?.score ?? question.options[1].score
      },
      updatedAt: new Date().toISOString()
    }));

    const result = computeAssessmentScore({
      assessmentId: "assessment-2",
      tenantId: "tenant-2",
      answers,
      evidences: [
        {
          id: "evidence-1",
          tenantId: "tenant-2",
          assessmentId: "assessment-2",
          domain: "email_security",
          provider: "google-workspace",
          title: "DMARC missing",
          payload: {
            scoreDelta: -20,
            severity: "HIGH",
            impact: "Email spoofing risk stays high.",
            recommendation: "Configure DMARC.",
            evidenceRef: "dmarc"
          },
          createdAt: new Date().toISOString()
        }
      ]
    });

    expect(result.snapshot.totalScore).toBeLessThan(40);
    expect(result.findings.some((finding) => finding.domain === "email_security")).toBe(true);
  });
});
