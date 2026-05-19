import { QUESTION_BANK } from "@/lib/question-bank";
import {
  AdminTenantSummary,
  AssessmentComparison,
  AssessmentHistoryPoint,
  AssessmentRecord,
  AuditEventRecord,
  EvidenceRecord,
  Question,
  AnswerRecord,
  ScoreSnapshotRecord,
  StorageMode
} from "@/lib/types";

export { QUESTION_BANK };

function sharedRandomId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function buildAuditEvent(input: {
  action: string;
  tenantId: string | null;
  actorUserId: string | null;
  meta: Record<string, string>;
}): AuditEventRecord {
  return {
    id: sharedRandomId(),
    action: input.action,
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    createdAt: nowIso(),
    meta: input.meta
  };
}

export function googleWorkspaceEvidence(tenantId: string, assessmentId: string) {
  const createdAt = nowIso();
  return [
    {
      id: sharedRandomId(),
      tenantId,
      assessmentId,
      domain: "account_access" as const,
      provider: "google-workspace",
      title: "2 个管理员账号未启用 MFA",
      payload: {
        scoreDelta: -18,
        severity: "HIGH" as const,
        impact: "管理员账号一旦被钓鱼或撞库成功，将直接扩大横向移动风险。",
        recommendation: "优先补齐所有管理员账号的 MFA，并强制高风险登录校验。",
        evidenceRef: "google-admin-mfa"
      },
      createdAt
    },
    {
      id: sharedRandomId(),
      tenantId,
      assessmentId,
      domain: "email_security" as const,
      provider: "google-workspace",
      title: "DMARC 策略处于监控模式",
      payload: {
        scoreDelta: -12,
        severity: "MEDIUM" as const,
        impact: "邮件伪造仍可能绕过基础监控，对财务和销售场景风险较高。",
        recommendation: "将 DMARC 从 none 逐步提升到 quarantine/reject，并观察误判。",
        evidenceRef: "google-dmarc-policy"
      },
      createdAt
    }
  ] satisfies EvidenceRecord[];
}

export function buildAssessmentHistory(
  assessments: AssessmentRecord[],
  snapshots: ScoreSnapshotRecord[]
): AssessmentHistoryPoint[] {
  const latestSnapshotMap = new Map<string, ScoreSnapshotRecord>();

  for (const snapshot of [...snapshots].sort((left, right) => right.createdAt.localeCompare(left.createdAt))) {
    if (!latestSnapshotMap.has(snapshot.assessmentId)) {
      latestSnapshotMap.set(snapshot.assessmentId, snapshot);
    }
  }

  const ordered = [...assessments].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const timeline: AssessmentHistoryPoint[] = ordered.map((assessment) => {
    const snapshot = latestSnapshotMap.get(assessment.id) ?? null;
    return {
      assessmentId: assessment.id,
      title: assessment.title,
      createdAt: assessment.createdAt,
      totalScore: snapshot?.totalScore ?? null,
      status: snapshot?.status ?? assessment.status,
      deltaFromPrevious: null
    };
  });

  for (let index = 1; index < timeline.length; index += 1) {
    const previous = timeline[index - 1];
    const current = timeline[index];
    if (previous.totalScore !== null && current.totalScore !== null) {
      current.deltaFromPrevious = current.totalScore - previous.totalScore;
    }
  }

  return timeline.reverse();
}

export function buildAssessmentComparison(
  assessmentId: string,
  history: AssessmentHistoryPoint[]
): AssessmentComparison {
  const chronological = [...history].reverse();
  const index = chronological.findIndex((item) => item.assessmentId === assessmentId);
  const current = index >= 0 ? chronological[index] : null;
  const previous = index > 0 ? chronological[index - 1] : null;
  return {
    current,
    previous,
    delta:
      current && previous && current.totalScore !== null && previous.totalScore !== null
        ? current.totalScore - previous.totalScore
        : null
  };
}

export function summarizeTenants(input: {
  tenants: Array<{ id: string; name: string; slug: string }>;
  assessments: AssessmentRecord[];
  reports: Array<{ tenantId: string; generatedAt: string }>;
  snapshots: ScoreSnapshotRecord[];
}): AdminTenantSummary[] {
  return input.tenants.map((tenant) => {
    const tenantAssessments = input.assessments.filter((assessment) => assessment.tenantId === tenant.id);
    const latestReportAt =
      [...input.reports]
        .filter((report) => report.tenantId === tenant.id)
        .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))[0]?.generatedAt ?? null;
    const latestScore =
      [...input.snapshots]
        .filter((snapshot) => tenantAssessments.some((assessment) => assessment.id === snapshot.assessmentId))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]?.totalScore ?? null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      assessments: tenantAssessments.length,
      latestReportAt,
      latestScore
    };
  });
}

export function buildRetestTitle(sourceTitle: string, existingTitles: string[]) {
  const baseTitle = sourceTitle.replace(/\s*[·-]\s*复测\s*\d+$/u, "").replace(/\s*复测\s*\d+$/u, "").trim();
  const normalizedBaseTitle = baseTitle || "网络安全体检";
  const existing = new Set(existingTitles);
  let sequence = 1;
  let candidate = `${normalizedBaseTitle} · 复测 ${sequence}`;
  while (existing.has(candidate)) {
    sequence += 1;
    candidate = `${normalizedBaseTitle} · 复测 ${sequence}`;
  }
  return candidate;
}

export function buildRequiredProgress(questions: Question[], answers: AnswerRecord[]) {
  const requiredQuestions = questions.filter((question) => question.required);
  const answeredQuestionIds = new Set(answers.map((answer) => answer.questionId));
  const missingQuestions = requiredQuestions.filter((question) => !answeredQuestionIds.has(question.id));

  return {
    requiredTotal: requiredQuestions.length,
    answeredRequired: requiredQuestions.length - missingQuestions.length,
    missingQuestions
  };
}

export function storageLabel(mode: StorageMode) {
  return mode === "prisma" ? "PostgreSQL / Prisma" : "Demo JSON Store";
}
