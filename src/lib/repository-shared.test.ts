import { describe, expect, it } from "vitest";

import { buildRequiredProgress, buildRetestTitle } from "@/lib/repository-shared";
import { QUESTION_BANK } from "@/lib/question-bank";

describe("buildRetestTitle", () => {
  it("increments retest sequence from the source title", () => {
    expect(buildRetestTitle("2026 Q2 网络安全体检", ["2026 Q2 网络安全体检", "2026 Q2 网络安全体检 · 复测 1"])).toBe(
      "2026 Q2 网络安全体检 · 复测 2"
    );
  });

  it("normalizes an existing retest title before generating the next one", () => {
    expect(
      buildRetestTitle("2026 Q2 网络安全体检 · 复测 2", [
        "2026 Q2 网络安全体检",
        "2026 Q2 网络安全体检 · 复测 1",
        "2026 Q2 网络安全体检 · 复测 2"
      ])
    ).toBe("2026 Q2 网络安全体检 · 复测 3");
  });
});

describe("buildRequiredProgress", () => {
  it("counts answered and missing required questions", () => {
    const questions = QUESTION_BANK.slice(0, 3);
    const progress = buildRequiredProgress(questions, [
      {
        id: "answer-1",
        tenantId: "tenant-1",
        assessmentId: "assessment-1",
        questionId: questions[0].id,
        value: {
          selectedValue: questions[0].options[0].value,
          selectedLabel: questions[0].options[0].label,
          score: questions[0].options[0].score
        },
        updatedAt: new Date().toISOString()
      }
    ]);

    expect(progress.answeredRequired).toBe(1);
    expect(progress.requiredTotal).toBe(3);
    expect(progress.missingQuestions.map((question) => question.id)).toEqual([questions[1].id, questions[2].id]);
  });
});
