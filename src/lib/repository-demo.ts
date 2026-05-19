import { randomUUID } from "node:crypto";

import { mutateState, readState } from "@/lib/demo-store";
import { computeAssessmentScore } from "@/lib/scoring";
import {
  AdminAuditEvent,
  AnswerRecord,
  AssessmentDashboard,
  AssessmentRecord,
  MembershipRecord,
  PhishingSimulationRecord,
  ReportRecord,
  StoredAnswerValue,
  TrainingCampaignRecord,
  UserRecord
} from "@/lib/types";
import {
  buildAssessmentComparison,
  buildAssessmentHistory,
  buildAuditEvent,
  googleWorkspaceEvidence,
  nowIso,
  QUESTION_BANK,
  summarizeTenants
} from "@/lib/repository-shared";
import { slugify } from "@/lib/utils";

export async function getStorageMode() {
  return "demo" as const;
}

export async function findUserByEmail(email: string) {
  const state = await readState();
  return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createTenantOwner(input: {
  email: string;
  name: string;
  passwordHash: string;
  tenantName: string;
}) {
  return mutateState(async (state) => {
    if (state.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("EMAIL_EXISTS");
    }

    const tenantId = randomUUID();
    const userId = randomUUID();
    const createdAt = nowIso();
    const tenant = {
      id: tenantId,
      name: input.tenantName,
      slug: slugify(input.tenantName),
      createdAt
    };
    const user: UserRecord = {
      id: userId,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      systemRole: "STANDARD",
      createdAt
    };
    const membership: MembershipRecord = {
      id: randomUUID(),
      userId,
      tenantId,
      role: "OWNER",
      createdAt
    };
    const assessment: AssessmentRecord = {
      id: randomUUID(),
      tenantId,
      title: "首次网络安全体检",
      status: "DRAFT",
      sourceMode: "hybrid",
      createdAt,
      updatedAt: createdAt
    };

    state.tenants.push(tenant);
    state.users.push(user);
    state.memberships.push(membership);
    state.assessments.push(assessment);
    state.auditEvents.push(
      buildAuditEvent({
        action: "tenant-owner-created",
        tenantId,
        actorUserId: userId,
        meta: { email: input.email }
      })
    );

    return { user, tenant, membership, assessment };
  });
}

export async function getUserContext(userId: string) {
  const state = await readState();
  const user = state.users.find((item) => item.id === userId) ?? null;
  if (!user) {
    return null;
  }
  const memberships = state.memberships.filter((item) => item.userId === userId);
  const tenants = state.tenants.filter((tenant) => memberships.some((membership) => membership.tenantId === tenant.id));
  return {
    user,
    memberships,
    tenants
  };
}

export async function listAssessments(tenantId: string) {
  const state = await readState();
  return state.assessments
    .filter((assessment) => assessment.tenantId === tenantId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createAssessment(tenantId: string, title: string, actorUserId?: string) {
  return mutateState(async (state) => {
    const createdAt = nowIso();
    const assessment: AssessmentRecord = {
      id: randomUUID(),
      tenantId,
      title,
      status: "DRAFT",
      sourceMode: "hybrid",
      createdAt,
      updatedAt: createdAt
    };
    state.assessments.push(assessment);
    state.auditEvents.push(
      buildAuditEvent({
        action: "assessment-created",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { assessmentId: assessment.id, title }
      })
    );
    return assessment;
  });
}

export async function getAssessmentById(tenantId: string, assessmentId: string) {
  const state = await readState();
  return state.assessments.find((assessment) => assessment.id === assessmentId && assessment.tenantId === tenantId) ?? null;
}

export async function updateAssessment(
  tenantId: string,
  assessmentId: string,
  patch: Partial<Pick<AssessmentRecord, "title" | "status">>,
  actorUserId?: string
) {
  return mutateState(async (state) => {
    const assessment = state.assessments.find((item) => item.id === assessmentId && item.tenantId === tenantId);
    if (!assessment) {
      return null;
    }
    if (patch.title) {
      assessment.title = patch.title;
    }
    if (patch.status) {
      assessment.status = patch.status;
    }
    assessment.updatedAt = nowIso();
    state.auditEvents.push(
      buildAuditEvent({
        action: "assessment-updated",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { assessmentId, status: assessment.status }
      })
    );
    return assessment;
  });
}

export async function upsertAnswer(
  tenantId: string,
  assessmentId: string,
  questionId: string,
  value: StoredAnswerValue,
  actorUserId?: string
) {
  return mutateState(async (state) => {
    const existing = state.answers.find((answer) => answer.assessmentId === assessmentId && answer.questionId === questionId && answer.tenantId === tenantId);
    if (existing) {
      existing.value = value;
      existing.updatedAt = nowIso();
    } else {
      const answer: AnswerRecord = {
        id: randomUUID(),
        tenantId,
        assessmentId,
        questionId,
        value,
        updatedAt: nowIso()
      };
      state.answers.push(answer);
    }
    const assessment = state.assessments.find((item) => item.id === assessmentId && item.tenantId === tenantId);
    if (assessment && assessment.status === "DRAFT") {
      assessment.status = "COLLECTING";
      assessment.updatedAt = nowIso();
    }
    state.auditEvents.push(
      buildAuditEvent({
        action: "answer-saved",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { assessmentId, questionId, selectedValue: value.selectedValue }
      })
    );
    return state.answers.find((answer) => answer.assessmentId === assessmentId && answer.questionId === questionId && answer.tenantId === tenantId) ?? null;
  });
}

export async function connectGoogleWorkspace(tenantId: string, assessmentId: string, actorUserId?: string) {
  return mutateState(async (state) => {
    const createdAt = nowIso();
    state.integrationConnections.push({
      id: randomUUID(),
      tenantId,
      provider: "google-workspace",
      status: "connected",
      externalRef: "demo-google-workspace",
      createdAt,
      updatedAt: createdAt
    });
    const evidences = googleWorkspaceEvidence(tenantId, assessmentId);
    state.evidences.push(...evidences);
    state.auditEvents.push(
      buildAuditEvent({
        action: "integration-connected",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { assessmentId, provider: "google-workspace", evidences: String(evidences.length) }
      })
    );
    return state.evidences.filter((evidence) => evidence.assessmentId === assessmentId && evidence.tenantId === tenantId);
  });
}

export async function scoreAssessment(tenantId: string, assessmentId: string, actorUserId?: string) {
  return mutateState(async (state) => {
    const assessment = state.assessments.find((item) => item.id === assessmentId && item.tenantId === tenantId);
    if (!assessment) {
      throw new Error("ASSESSMENT_NOT_FOUND");
    }

    state.findings = state.findings.filter((finding) => !(finding.assessmentId === assessmentId && finding.tenantId === tenantId));
    state.scoreSnapshots = state.scoreSnapshots.filter((snapshot) => !(snapshot.assessmentId === assessmentId && snapshot.tenantId === tenantId));

    const answers = state.answers.filter((answer) => answer.assessmentId === assessmentId && answer.tenantId === tenantId);
    const evidences = state.evidences.filter((evidence) => evidence.assessmentId === assessmentId && evidence.tenantId === tenantId);
    const result = computeAssessmentScore({
      assessmentId,
      tenantId,
      answers,
      evidences
    });

    state.findings.push(...result.findings);
    state.scoreSnapshots.push(result.snapshot);
    assessment.status = "SCORED";
    assessment.updatedAt = nowIso();
    state.auditEvents.push(
      buildAuditEvent({
        action: "assessment-scored",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { assessmentId, totalScore: String(result.snapshot.totalScore) }
      })
    );
    return result;
  });
}

export async function createReport(tenantId: string, assessmentId: string, actorUserId?: string) {
  return mutateState(async (state) => {
    const assessment = state.assessments.find((item) => item.id === assessmentId && item.tenantId === tenantId);
    const snapshot = [...state.scoreSnapshots]
      .filter((item) => item.assessmentId === assessmentId && item.tenantId === tenantId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
    const tenant = state.tenants.find((item) => item.id === tenantId);
    if (!assessment || !snapshot || !tenant) {
      throw new Error("REPORT_PREREQUISITE_MISSING");
    }
    const findings = state.findings.filter((item) => item.assessmentId === assessmentId && item.tenantId === tenantId);
    const report: ReportRecord = {
      id: randomUUID(),
      tenantId,
      assessmentId,
      snapshotId: snapshot.id,
      generatedAt: nowIso(),
      snapshot: {
        tenantName: tenant.name,
        assessmentTitle: assessment.title,
        totalScore: snapshot.totalScore,
        status: snapshot.status,
        domainScores: snapshot.domainScores,
        findings,
        generatedAt: nowIso()
      }
    };
    state.reports.push(report);
    assessment.status = "REPORTED";
    assessment.updatedAt = nowIso();
    state.auditEvents.push(
      buildAuditEvent({
        action: "report-generated",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { assessmentId, reportId: report.id }
      })
    );
    return report;
  });
}

export async function getAssessmentDashboard(tenantId: string, assessmentId: string): Promise<AssessmentDashboard | null> {
  const state = await readState();
  const assessment = state.assessments.find((item) => item.id === assessmentId && item.tenantId === tenantId);
  const tenant = state.tenants.find((item) => item.id === tenantId);
  if (!assessment || !tenant) {
    return null;
  }

  const tenantAssessments = state.assessments.filter((item) => item.tenantId === tenantId);
  const tenantSnapshots = state.scoreSnapshots.filter((item) => item.tenantId === tenantId);
  const history = buildAssessmentHistory(tenantAssessments, tenantSnapshots);

  const latestSnapshot = [...state.scoreSnapshots]
    .filter((item) => item.assessmentId === assessmentId && item.tenantId === tenantId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;
  const latestReport = [...state.reports]
    .filter((item) => item.assessmentId === assessmentId && item.tenantId === tenantId)
    .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))[0] ?? null;

  return {
    tenantName: tenant.name,
    storageMode: "demo",
    assessment,
    answers: state.answers.filter((item) => item.assessmentId === assessmentId && item.tenantId === tenantId),
    evidences: state.evidences.filter((item) => item.assessmentId === assessmentId && item.tenantId === tenantId),
    findings: state.findings.filter((item) => item.assessmentId === assessmentId && item.tenantId === tenantId),
    latestSnapshot,
    latestReport,
    questions: QUESTION_BANK,
    trainingCampaigns: state.trainingCampaigns.filter((item) => item.tenantId === tenantId),
    phishingSimulations: state.phishingSimulations.filter((item) => item.tenantId === tenantId),
    history,
    comparison: buildAssessmentComparison(assessmentId, history)
  };
}

export async function getReportById(tenantId: string, reportId: string) {
  const state = await readState();
  return state.reports.find((report) => report.id === reportId && report.tenantId === tenantId) ?? null;
}

export async function getReportByIdForTenants(reportId: string, tenantIds: string[]) {
  const state = await readState();
  const allowedTenantIds = new Set(tenantIds);
  return state.reports.find((report) => report.id === reportId && allowedTenantIds.has(report.tenantId)) ?? null;
}

export async function listTrainingCampaigns(tenantId: string) {
  const state = await readState();
  return state.trainingCampaigns.filter((campaign) => campaign.tenantId === tenantId);
}

export async function createTrainingCampaign(
  tenantId: string,
  input: Pick<TrainingCampaignRecord, "name" | "description" | "completion">,
  actorUserId?: string
) {
  return mutateState(async (state) => {
    const record: TrainingCampaignRecord = {
      id: randomUUID(),
      tenantId,
      name: input.name,
      description: input.description,
      completion: input.completion,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    state.trainingCampaigns.push(record);
    state.auditEvents.push(
      buildAuditEvent({
        action: "training-campaign-created",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { campaignId: record.id, name: record.name }
      })
    );
    return record;
  });
}

export async function listPhishingSimulations(tenantId: string) {
  const state = await readState();
  return state.phishingSimulations.filter((simulation) => simulation.tenantId === tenantId);
}

export async function createPhishingSimulation(
  tenantId: string,
  input: Pick<PhishingSimulationRecord, "name" | "template" | "employeeCount" | "submittedCount">,
  actorUserId?: string
) {
  return mutateState(async (state) => {
    const record: PhishingSimulationRecord = {
      id: randomUUID(),
      tenantId,
      name: input.name,
      template: input.template,
      employeeCount: input.employeeCount,
      submittedCount: input.submittedCount,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    state.phishingSimulations.push(record);
    state.auditEvents.push(
      buildAuditEvent({
        action: "phishing-simulation-created",
        tenantId,
        actorUserId: actorUserId ?? null,
        meta: { simulationId: record.id, name: record.name }
      })
    );
    return record;
  });
}

export async function listTenantsForAdmin() {
  const state = await readState();
  return summarizeTenants({
    tenants: state.tenants,
    assessments: state.assessments,
    reports: state.reports,
    snapshots: state.scoreSnapshots
  });
}

export async function listAuditEventsForAdmin(limit = 20): Promise<AdminAuditEvent[]> {
  const state = await readState();
  return [...state.auditEvents]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit)
    .map((event) => ({
      ...event,
      tenantName: event.tenantId ? state.tenants.find((tenant) => tenant.id === event.tenantId)?.name ?? null : null,
      actorName: event.actorUserId ? state.users.find((user) => user.id === event.actorUserId)?.name ?? null : null
    }));
}
