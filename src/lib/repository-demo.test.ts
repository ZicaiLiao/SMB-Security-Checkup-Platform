import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { createRetestAssessment, getAssessmentDashboard } from "@/lib/repository-demo";
import { readState, writeState } from "@/lib/demo-store";

let originalState: Awaited<ReturnType<typeof readState>>;

beforeEach(async () => {
  originalState = JSON.parse(JSON.stringify(await readState()));
});

afterEach(async () => {
  await writeState(originalState);
});

describe("createRetestAssessment", () => {
  it("creates a follow-up assessment and copies questionnaire answers", async () => {
    const state = await readState();
    const tenant = state.tenants[0];
    const sourceAssessment = state.assessments.find((assessment) => assessment.tenantId === tenant.id);
    expect(sourceAssessment).toBeTruthy();

    const sourceAnswers = state.answers.filter((answer) => answer.assessmentId === sourceAssessment!.id);
    const retest = await createRetestAssessment(tenant.id, sourceAssessment!.id, state.users[0].id);

    expect(retest).toBeTruthy();
    expect(retest?.id).not.toBe(sourceAssessment?.id);
    expect(retest?.status).toBe(sourceAnswers.length > 0 ? "COLLECTING" : "DRAFT");
    expect(retest?.title).toContain("复测");

    const updatedState = await readState();
    const copiedAnswers = updatedState.answers.filter((answer) => answer.assessmentId === retest?.id);
    expect(copiedAnswers).toHaveLength(sourceAnswers.length);
    expect(copiedAnswers.map((answer) => answer.questionId).sort()).toEqual(sourceAnswers.map((answer) => answer.questionId).sort());

    const dashboard = await getAssessmentDashboard(tenant.id, retest!.id);
    expect(dashboard?.comparison.previous?.assessmentId).toBe(sourceAssessment?.id);
    expect(dashboard?.history[0]?.assessmentId).toBe(retest?.id);
  });
});
