import { randomUUID } from "node:crypto";

import { readState } from "@/lib/demo-store";
import { getPrismaClient } from "@/lib/prisma";
import { computeAssessmentScore } from "@/lib/scoring";
import {
  AdminAuditEvent,
  AnswerRecord,
  AssessmentDashboard,
  AssessmentRecord,
  MembershipRecord,
  ReportRecord,
  StoredAnswerValue,
  UserRecord
} from "@/lib/types";
import {
  buildAssessmentComparison,
  buildAssessmentHistory,
  buildAuditEvent,
  buildRetestTitle,
  googleWorkspaceEvidence,
  nowIso,
  QUESTION_BANK,
  summarizeTenants
} from "@/lib/repository-shared";
import { slugify } from "@/lib/utils";

function toUserRecord(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    systemRole: row.systemRole,
    createdAt: row.createdAt.toISOString()
  };
}

function toMembershipRecord(row: any): MembershipRecord {
  return {
    id: row.id,
    userId: row.userId,
    tenantId: row.tenantId,
    role: row.role,
    createdAt: row.createdAt.toISOString()
  };
}

function toAssessmentRecord(row: any): AssessmentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    status: row.status,
    sourceMode: row.sourceMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function toAnswerRecord(row: any): AnswerRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assessmentId: row.assessmentId,
    questionId: row.questionId,
    value: row.value,
    updatedAt: row.updatedAt.toISOString()
  };
}

function toReportRecord(row: any): ReportRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assessmentId: row.assessmentId,
    snapshotId: row.snapshotId,
    generatedAt: row.generatedAt.toISOString(),
    snapshot: row.snapshot
  };
}

async function ensurePrismaSeeded(prisma: any) {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return;
  }

  const state = await readState();

  await prisma.user.createMany({
    data: state.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      systemRole: user.systemRole,
      createdAt: new Date(user.createdAt)
    }))
  });

  await prisma.tenant.createMany({
    data: state.tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: new Date(tenant.createdAt)
    }))
  });

  await prisma.membership.createMany({
    data: state.memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      role: membership.role,
      createdAt: new Date(membership.createdAt)
    }))
  });

  await prisma.assessment.createMany({
    data: state.assessments.map((assessment) => ({
      id: assessment.id,
      tenantId: assessment.tenantId,
      title: assessment.title,
      status: assessment.status,
      sourceMode: assessment.sourceMode,
      createdAt: new Date(assessment.createdAt),
      updatedAt: new Date(assessment.updatedAt)
    }))
  });

  await prisma.answer.createMany({
    data: state.answers.map((answer) => ({
      id: answer.id,
      tenantId: answer.tenantId,
      assessmentId: answer.assessmentId,
      questionId: answer.questionId,
      value: answer.value,
      createdAt: new Date(answer.updatedAt),
      updatedAt: new Date(answer.updatedAt)
    }))
  });

  await prisma.integrationConnection.createMany({
    data: state.integrationConnections.map((connection) => ({
      id: connection.id,
      tenantId: connection.tenantId,
      provider: connection.provider,
      status: connection.status,
      externalRef: connection.externalRef,
      createdAt: new Date(connection.createdAt),
      updatedAt: new Date(connection.updatedAt)
    }))
  });

  await prisma.evidence.createMany({
    data: state.evidences.map((evidence) => ({
      id: evidence.id,
      tenantId: evidence.tenantId,
      assessmentId: evidence.assessmentId,
      domain: evidence.domain,
      provider: evidence.provider,
      title: evidence.title,
      payload: evidence.payload,
      createdAt: new Date(evidence.createdAt)
    }))
  });

  await prisma.riskFinding.createMany({
    data: state.findings.map((finding) => ({
      id: finding.id,
      tenantId: finding.tenantId,
      assessmentId: finding.assessmentId,
      domain: finding.domain,
      severity: finding.severity,
      title: finding.title,
      impact: finding.impact,
      recommendation: finding.recommendation,
      evidenceRefs: finding.evidenceRefs,
      createdAt: new Date(finding.createdAt)
    }))
  });

  await prisma.scoreSnapshot.createMany({
    data: state.scoreSnapshots.map((snapshot) => ({
      id: snapshot.id,
      tenantId: snapshot.tenantId,
      assessmentId: snapshot.assessmentId,
      totalScore: snapshot.totalScore,
      domainScores: snapshot.domainScores,
      status: snapshot.status,
      summary: snapshot.summary,
      createdAt: new Date(snapshot.createdAt)
    }))
  });

  await prisma.report.createMany({
    data: state.reports.map((report) => ({
      id: report.id,
      tenantId: report.tenantId,
      assessmentId: report.assessmentId,
      snapshotId: report.snapshotId,
      generatedAt: new Date(report.generatedAt),
      snapshot: report.snapshot
    }))
  });

  await prisma.trainingCampaign.createMany({
    data: state.trainingCampaigns.map((campaign) => ({
      id: campaign.id,
      tenantId: campaign.tenantId,
      name: campaign.name,
      description: campaign.description,
      completion: campaign.completion,
      createdAt: new Date(campaign.createdAt),
      updatedAt: new Date(campaign.updatedAt)
    }))
  });

  await prisma.phishingSimulation.createMany({
    data: state.phishingSimulations.map((simulation) => ({
      id: simulation.id,
      tenantId: simulation.tenantId,
      name: simulation.name,
      template: simulation.template,
      employeeCount: simulation.employeeCount,
      submittedCount: simulation.submittedCount,
      createdAt: new Date(simulation.createdAt),
      updatedAt: new Date(simulation.updatedAt)
    }))
  });

  await prisma.auditEvent.createMany({
    data: state.auditEvents.map((event) => ({
      id: event.id,
      tenantId: event.tenantId,
      actorUserId: event.actorUserId,
      action: event.action,
      meta: event.meta,
      createdAt: new Date(event.createdAt)
    }))
  });
}

async function getReadyPrisma() {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }
  await ensurePrismaSeeded(prisma);
  return prisma;
}

export async function getStorageMode() {
  const prisma = await getReadyPrisma();
  return prisma ? ("prisma" as const) : null;
}

export async function findUserByEmail(email: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? toUserRecord(user) : null;
}

export async function createTenantOwner(input: {
  email: string;
  name: string;
  passwordHash: string;
  tenantName: string;
}) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const createdAt = new Date();
  const tenantId = randomUUID();
  const userId = randomUUID();
  const assessmentId = randomUUID();

  await prisma.tenant.create({
    data: {
      id: tenantId,
      name: input.tenantName,
      slug: slugify(input.tenantName),
      createdAt
    }
  });

  await prisma.user.create({
    data: {
      id: userId,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      systemRole: "STANDARD",
      createdAt
    }
  });

  await prisma.membership.create({
    data: {
      id: randomUUID(),
      userId,
      tenantId,
      role: "OWNER",
      createdAt
    }
  });

  await prisma.assessment.create({
    data: {
      id: assessmentId,
      tenantId,
      title: "首次网络安全体检",
      status: "DRAFT",
      sourceMode: "hybrid",
      createdAt,
      updatedAt: createdAt
    }
  });

  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: userId,
      action: "tenant-owner-created",
      meta: { email: input.email },
      createdAt
    }
  });

  return {
    user: {
      id: userId,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      systemRole: "STANDARD",
      createdAt: createdAt.toISOString()
    },
    tenant: {
      id: tenantId,
      name: input.tenantName,
      slug: slugify(input.tenantName),
      createdAt: createdAt.toISOString()
    },
    membership: {
      id: randomUUID(),
      userId,
      tenantId,
      role: "OWNER",
      createdAt: createdAt.toISOString()
    },
    assessment: {
      id: assessmentId,
      tenantId,
      title: "首次网络安全体检",
      status: "DRAFT",
      sourceMode: "hybrid",
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString()
    }
  };
}

export async function getUserContext(userId: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { memberships: true } });
  if (!user) {
    return null;
  }
  const tenantIds = user.memberships.map((membership: any) => membership.tenantId);
  const tenants = await prisma.tenant.findMany({ where: { id: { in: tenantIds } } });
  return {
    user: toUserRecord(user),
    memberships: user.memberships.map(toMembershipRecord),
    tenants: tenants.map((tenant: any) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt.toISOString()
    }))
  };
}

export async function listAssessments(tenantId: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return [];
  }
  const assessments = await prisma.assessment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });
  return assessments.map(toAssessmentRecord);
}

export async function createAssessment(tenantId: string, title: string, actorUserId?: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const createdAt = new Date();
  const assessment = await prisma.assessment.create({
    data: {
      id: randomUUID(),
      tenantId,
      title,
      status: "DRAFT",
      sourceMode: "hybrid",
      createdAt,
      updatedAt: createdAt
    }
  });
  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "assessment-created",
      meta: { assessmentId: assessment.id, title },
      createdAt
    }
  });
  return toAssessmentRecord(assessment);
}

export async function createRetestAssessment(tenantId: string, sourceAssessmentId: string, actorUserId?: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }

  const sourceAssessment = await prisma.assessment.findFirst({ where: { id: sourceAssessmentId, tenantId } });
  if (!sourceAssessment) {
    throw new Error("ASSESSMENT_NOT_FOUND");
  }

  const [existingAssessments, sourceAnswers] = await Promise.all([
    prisma.assessment.findMany({ where: { tenantId }, select: { title: true } }),
    prisma.answer.findMany({ where: { tenantId, assessmentId: sourceAssessmentId } })
  ]);

  const createdAt = new Date();
  const assessmentId = randomUUID();
  const title = buildRetestTitle(
    sourceAssessment.title,
    existingAssessments.map((assessment: { title: string }) => assessment.title)
  );

  const assessment = await (prisma as any).$transaction(async (tx: any) => {
    const createdAssessment = await tx.assessment.create({
      data: {
        id: assessmentId,
        tenantId,
        title,
        status: sourceAnswers.length > 0 ? "COLLECTING" : "DRAFT",
        sourceMode: sourceAssessment.sourceMode,
        createdAt,
        updatedAt: createdAt
      }
    });

    if (sourceAnswers.length > 0) {
      await tx.answer.createMany({
        data: sourceAnswers.map((answer: any) => ({
          id: randomUUID(),
          tenantId,
          assessmentId,
          questionId: answer.questionId,
          value: answer.value,
          createdAt,
          updatedAt: createdAt
        }))
      });
    }

    await tx.auditEvent.create({
      data: {
        id: randomUUID(),
        tenantId,
        actorUserId: actorUserId ?? null,
        action: "assessment-retest-created",
        meta: {
          assessmentId,
          sourceAssessmentId,
          copiedAnswers: String(sourceAnswers.length)
        },
        createdAt
      }
    });

    return createdAssessment;
  });

  return toAssessmentRecord(assessment);
}

export async function getAssessmentById(tenantId: string, assessmentId: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, tenantId } });
  return assessment ? toAssessmentRecord(assessment) : null;
}

export async function updateAssessment(
  tenantId: string,
  assessmentId: string,
  patch: Partial<Pick<AssessmentRecord, "title" | "status">>,
  actorUserId?: string
) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const existing = await prisma.assessment.findFirst({ where: { id: assessmentId, tenantId } });
  if (!existing) {
    return null;
  }
  const assessment = await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      ...(patch.title ? { title: patch.title } : {}),
      ...(patch.status ? { status: patch.status } : {})
    }
  });
  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "assessment-updated",
      meta: { assessmentId, status: assessment.status },
      createdAt: new Date()
    }
  });
  return toAssessmentRecord(assessment);
}

export async function upsertAnswer(
  tenantId: string,
  assessmentId: string,
  questionId: string,
  value: StoredAnswerValue,
  actorUserId?: string
) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }

  const answer = await prisma.answer.upsert({
    where: { assessmentId_questionId: { assessmentId, questionId } },
    update: { value },
    create: {
      id: randomUUID(),
      tenantId,
      assessmentId,
      questionId,
      value
    }
  });

  await prisma.assessment.updateMany({
    where: { id: assessmentId, tenantId, status: "DRAFT" },
    data: { status: "COLLECTING" }
  });

  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "answer-saved",
      meta: { assessmentId, questionId, selectedValue: value.selectedValue },
      createdAt: new Date()
    }
  });

  return toAnswerRecord(answer);
}

export async function connectGoogleWorkspace(tenantId: string, assessmentId: string, actorUserId?: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return [];
  }
  const createdAt = new Date();
  await prisma.integrationConnection.create({
    data: {
      id: randomUUID(),
      tenantId,
      provider: "google-workspace",
      status: "connected",
      externalRef: "demo-google-workspace",
      createdAt,
      updatedAt: createdAt
    }
  });

  const evidences = googleWorkspaceEvidence(tenantId, assessmentId);
  await prisma.evidence.createMany({
    data: evidences.map((evidence) => ({
      ...evidence,
      createdAt: new Date(evidence.createdAt)
    }))
  });

  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "integration-connected",
      meta: { assessmentId, provider: "google-workspace", evidences: String(evidences.length) },
      createdAt
    }
  });

  return evidences;
}

export async function scoreAssessment(tenantId: string, assessmentId: string, actorUserId?: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    throw new Error("PRISMA_UNAVAILABLE");
  }

  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, tenantId } });
  if (!assessment) {
    throw new Error("ASSESSMENT_NOT_FOUND");
  }

  const [answers, evidences] = await Promise.all([
    prisma.answer.findMany({ where: { tenantId, assessmentId } }),
    prisma.evidence.findMany({ where: { tenantId, assessmentId } })
  ]);

  const result = computeAssessmentScore({
    assessmentId,
    tenantId,
    answers: answers.map(toAnswerRecord),
    evidences: evidences.map((evidence: any) => ({
      id: evidence.id,
      tenantId: evidence.tenantId,
      assessmentId: evidence.assessmentId,
      domain: evidence.domain,
      provider: evidence.provider,
      title: evidence.title,
      payload: evidence.payload,
      createdAt: evidence.createdAt.toISOString()
    }))
  });

  await prisma.riskFinding.deleteMany({ where: { tenantId, assessmentId } });
  await prisma.scoreSnapshot.deleteMany({ where: { tenantId, assessmentId } });

  await prisma.scoreSnapshot.create({
    data: {
      id: result.snapshot.id,
      tenantId,
      assessmentId,
      totalScore: result.snapshot.totalScore,
      domainScores: result.snapshot.domainScores,
      status: result.snapshot.status,
      summary: result.snapshot.summary,
      createdAt: new Date(result.snapshot.createdAt)
    }
  });

  if (result.findings.length > 0) {
    await prisma.riskFinding.createMany({
      data: result.findings.map((finding) => ({
        id: finding.id,
        tenantId,
        assessmentId,
        domain: finding.domain,
        severity: finding.severity,
        title: finding.title,
        impact: finding.impact,
        recommendation: finding.recommendation,
        evidenceRefs: finding.evidenceRefs,
        createdAt: new Date(finding.createdAt)
      }))
    });
  }

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: "SCORED" }
  });

  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "assessment-scored",
      meta: { assessmentId, totalScore: String(result.snapshot.totalScore) },
      createdAt: new Date()
    }
  });

  return result;
}

export async function createReport(tenantId: string, assessmentId: string, actorUserId?: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    throw new Error("PRISMA_UNAVAILABLE");
  }

  const [assessment, tenant, snapshot, findings] = await Promise.all([
    prisma.assessment.findFirst({ where: { id: assessmentId, tenantId } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.scoreSnapshot.findFirst({ where: { tenantId, assessmentId }, orderBy: { createdAt: "desc" } }),
    prisma.riskFinding.findMany({ where: { tenantId, assessmentId } })
  ]);

  if (!assessment || !tenant || !snapshot) {
    throw new Error("REPORT_PREREQUISITE_MISSING");
  }

  const report = await prisma.report.create({
    data: {
      id: randomUUID(),
      tenantId,
      assessmentId,
      snapshotId: snapshot.id,
      generatedAt: new Date(),
      snapshot: {
        tenantName: tenant.name,
        assessmentTitle: assessment.title,
        totalScore: snapshot.totalScore,
        status: snapshot.status,
        domainScores: snapshot.domainScores,
        findings: findings.map((finding: any) => ({
          id: finding.id,
          tenantId: finding.tenantId,
          assessmentId: finding.assessmentId,
          domain: finding.domain,
          severity: finding.severity,
          title: finding.title,
          impact: finding.impact,
          recommendation: finding.recommendation,
          evidenceRefs: finding.evidenceRefs,
          createdAt: finding.createdAt.toISOString()
        })),
        generatedAt: nowIso()
      }
    }
  });

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: "REPORTED" }
  });

  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "report-generated",
      meta: { assessmentId, reportId: report.id },
      createdAt: new Date()
    }
  });

  return toReportRecord(report);
}

export async function getAssessmentDashboard(tenantId: string, assessmentId: string): Promise<AssessmentDashboard | null> {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }

  const [tenant, assessment, answers, evidences, findings, latestSnapshot, latestReport, trainingCampaigns, phishingSimulations, allAssessments, allSnapshots] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.assessment.findFirst({ where: { id: assessmentId, tenantId } }),
    prisma.answer.findMany({ where: { tenantId, assessmentId } }),
    prisma.evidence.findMany({ where: { tenantId, assessmentId } }),
    prisma.riskFinding.findMany({ where: { tenantId, assessmentId }, orderBy: { createdAt: "desc" } }),
    prisma.scoreSnapshot.findFirst({ where: { tenantId, assessmentId }, orderBy: { createdAt: "desc" } }),
    prisma.report.findFirst({ where: { tenantId, assessmentId }, orderBy: { generatedAt: "desc" } }),
    prisma.trainingCampaign.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.phishingSimulation.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.assessment.findMany({ where: { tenantId } }),
    prisma.scoreSnapshot.findMany({ where: { tenantId } })
  ]);

  if (!tenant || !assessment) {
    return null;
  }

  const history = buildAssessmentHistory(allAssessments.map(toAssessmentRecord), allSnapshots.map((snapshot: any) => ({
    id: snapshot.id,
    tenantId: snapshot.tenantId,
    assessmentId: snapshot.assessmentId,
    totalScore: snapshot.totalScore,
    domainScores: snapshot.domainScores,
    status: snapshot.status,
    summary: snapshot.summary,
    createdAt: snapshot.createdAt.toISOString()
  })));

  return {
    tenantName: tenant.name,
    storageMode: "prisma",
    assessment: toAssessmentRecord(assessment),
    answers: answers.map(toAnswerRecord),
    evidences: evidences.map((evidence: any) => ({
      id: evidence.id,
      tenantId: evidence.tenantId,
      assessmentId: evidence.assessmentId,
      domain: evidence.domain,
      provider: evidence.provider,
      title: evidence.title,
      payload: evidence.payload,
      createdAt: evidence.createdAt.toISOString()
    })),
    findings: findings.map((finding: any) => ({
      id: finding.id,
      tenantId: finding.tenantId,
      assessmentId: finding.assessmentId,
      domain: finding.domain,
      severity: finding.severity,
      title: finding.title,
      impact: finding.impact,
      recommendation: finding.recommendation,
      evidenceRefs: finding.evidenceRefs,
      createdAt: finding.createdAt.toISOString()
    })),
    latestSnapshot: latestSnapshot
      ? {
          id: latestSnapshot.id,
          tenantId: latestSnapshot.tenantId,
          assessmentId: latestSnapshot.assessmentId,
          totalScore: latestSnapshot.totalScore,
          domainScores: latestSnapshot.domainScores,
          status: latestSnapshot.status,
          summary: latestSnapshot.summary,
          createdAt: latestSnapshot.createdAt.toISOString()
        }
      : null,
    latestReport: latestReport ? toReportRecord(latestReport) : null,
    questions: QUESTION_BANK,
    trainingCampaigns: trainingCampaigns.map((campaign: any) => ({
      id: campaign.id,
      tenantId: campaign.tenantId,
      name: campaign.name,
      description: campaign.description,
      completion: campaign.completion,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString()
    })),
    phishingSimulations: phishingSimulations.map((simulation: any) => ({
      id: simulation.id,
      tenantId: simulation.tenantId,
      name: simulation.name,
      template: simulation.template,
      employeeCount: simulation.employeeCount,
      submittedCount: simulation.submittedCount,
      createdAt: simulation.createdAt.toISOString(),
      updatedAt: simulation.updatedAt.toISOString()
    })),
    history,
    comparison: buildAssessmentComparison(assessmentId, history)
  };
}

export async function getReportById(tenantId: string, reportId: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const report = await prisma.report.findFirst({ where: { id: reportId, tenantId } });
  return report ? toReportRecord(report) : null;
}

export async function getReportByIdForTenants(reportId: string, tenantIds: string[]) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      tenantId: {
        in: tenantIds
      }
    }
  });
  return report ? toReportRecord(report) : null;
}

export async function listTrainingCampaigns(tenantId: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return [];
  }
  const records = await prisma.trainingCampaign.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  return records.map((record: any) => ({
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    description: record.description,
    completion: record.completion,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  }));
}

export async function createTrainingCampaign(tenantId: string, input: { name: string; description: string; completion: number }, actorUserId?: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const createdAt = new Date();
  const record = await prisma.trainingCampaign.create({
    data: {
      id: randomUUID(),
      tenantId,
      name: input.name,
      description: input.description,
      completion: input.completion,
      createdAt,
      updatedAt: createdAt
    }
  });
  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "training-campaign-created",
      meta: { campaignId: record.id, name: record.name },
      createdAt
    }
  });
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    description: record.description,
    completion: record.completion,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function listPhishingSimulations(tenantId: string) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return [];
  }
  const records = await prisma.phishingSimulation.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  return records.map((record: any) => ({
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    template: record.template,
    employeeCount: record.employeeCount,
    submittedCount: record.submittedCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  }));
}

export async function createPhishingSimulation(
  tenantId: string,
  input: { name: string; template: string; employeeCount: number; submittedCount: number },
  actorUserId?: string
) {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return null;
  }
  const createdAt = new Date();
  const record = await prisma.phishingSimulation.create({
    data: {
      id: randomUUID(),
      tenantId,
      name: input.name,
      template: input.template,
      employeeCount: input.employeeCount,
      submittedCount: input.submittedCount,
      createdAt,
      updatedAt: createdAt
    }
  });
  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "phishing-simulation-created",
      meta: { simulationId: record.id, name: record.name },
      createdAt
    }
  });
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    template: record.template,
    employeeCount: record.employeeCount,
    submittedCount: record.submittedCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function listTenantsForAdmin() {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return [];
  }
  const [tenants, assessments, reports, snapshots] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.assessment.findMany(),
    prisma.report.findMany(),
    prisma.scoreSnapshot.findMany()
  ]);

  return summarizeTenants({
    tenants: tenants.map((tenant: any) => ({ id: tenant.id, name: tenant.name, slug: tenant.slug })),
    assessments: assessments.map(toAssessmentRecord),
    reports: reports.map((report: any) => ({ tenantId: report.tenantId, generatedAt: report.generatedAt.toISOString() })),
    snapshots: snapshots.map((snapshot: any) => ({
      id: snapshot.id,
      tenantId: snapshot.tenantId,
      assessmentId: snapshot.assessmentId,
      totalScore: snapshot.totalScore,
      domainScores: snapshot.domainScores,
      status: snapshot.status,
      summary: snapshot.summary,
      createdAt: snapshot.createdAt.toISOString()
    }))
  });
}

export async function listAuditEventsForAdmin(limit = 20): Promise<AdminAuditEvent[]> {
  const prisma = await getReadyPrisma();
  if (!prisma) {
    return [];
  }
  const events = await prisma.auditEvent.findMany({
    take: limit,
    orderBy: { createdAt: "desc" }
  });
  const tenantIds = events.map((event: any) => event.tenantId).filter(Boolean);
  const userIds = events.map((event: any) => event.actorUserId).filter(Boolean);
  const [tenants, users] = await Promise.all([
    prisma.tenant.findMany({ where: { id: { in: tenantIds } } }),
    prisma.user.findMany({ where: { id: { in: userIds } } })
  ]);
  return events.map((event: any) => ({
    id: event.id,
    tenantId: event.tenantId,
    actorUserId: event.actorUserId,
    action: event.action,
    createdAt: event.createdAt.toISOString(),
    meta: event.meta,
    tenantName: tenants.find((tenant: any) => tenant.id === event.tenantId)?.name ?? null,
    actorName: users.find((user: any) => user.id === event.actorUserId)?.name ?? null
  }));
}
