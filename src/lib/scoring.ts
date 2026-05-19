import { QUESTION_BANK } from "@/lib/question-bank";
import {
  AnswerRecord,
  EvidenceRecord,
  FindingSeverity,
  RiskFindingRecord,
  ScoreSnapshotRecord,
  SecurityDomain,
  SECURITY_DOMAINS
} from "@/lib/types";
import { scoreToSeverity } from "@/lib/utils";

function domainAverage(domain: SecurityDomain, answers: AnswerRecord[]) {
  const questions = QUESTION_BANK.filter((question) => question.domain === domain);
  const relatedAnswers = answers.filter((answer) => questions.some((question) => question.id === answer.questionId));

  if (questions.length === 0) {
    return 0;
  }

  const weightedTotal = relatedAnswers.reduce((sum, answer) => {
    const question = questions.find((item) => item.id === answer.questionId);
    return sum + answer.value.score * (question?.weight ?? 1);
  }, 0);

  const totalWeight = questions.reduce((sum, question) => sum + question.weight, 0);
  return totalWeight === 0 ? 0 : Math.round(weightedTotal / totalWeight);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function evidencePenalty(domain: SecurityDomain, evidences: EvidenceRecord[]) {
  return evidences
    .filter((evidence) => evidence.domain === domain)
    .reduce((sum, evidence) => sum + evidence.payload.scoreDelta, 0);
}

function autoFindingFromEvidence(assessmentId: string, tenantId: string, evidence: EvidenceRecord): RiskFindingRecord | null {
  if (!evidence.payload.severity || !evidence.payload.impact || !evidence.payload.recommendation) {
    return null;
  }

  return {
    id: `${evidence.id}-finding`,
    tenantId,
    assessmentId,
    domain: evidence.domain,
    severity: evidence.payload.severity,
    title: evidence.title,
    impact: evidence.payload.impact,
    recommendation: evidence.payload.recommendation,
    evidenceRefs: evidence.payload.evidenceRef ? [evidence.payload.evidenceRef] : [],
    createdAt: new Date().toISOString()
  };
}

export function computeAssessmentScore(input: {
  assessmentId: string;
  tenantId: string;
  answers: AnswerRecord[];
  evidences: EvidenceRecord[];
}) {
  const domainScores = {} as Record<SecurityDomain, number>;
  const findings: RiskFindingRecord[] = [];

  for (const domain of SECURITY_DOMAINS) {
    const score = clampScore(domainAverage(domain, input.answers) + evidencePenalty(domain, input.evidences));
    domainScores[domain] = score;
  }

  for (const evidence of input.evidences) {
    const derivedFinding = autoFindingFromEvidence(input.assessmentId, input.tenantId, evidence);
    if (derivedFinding) {
      findings.push(derivedFinding);
    }
  }

  for (const domain of SECURITY_DOMAINS) {
    const score = domainScores[domain];
    if (score < 50) {
      findings.push({
        id: `${input.assessmentId}-${domain}-gap`,
        tenantId: input.tenantId,
        assessmentId: input.assessmentId,
        domain,
        severity: scoreToSeverity(score) as FindingSeverity,
        title: `${domainLabel(domain)} 存在明显缺口`,
        impact: `${domainLabel(domain)} 的成熟度偏低，攻击成功后可能扩大影响面。`,
        recommendation: domainRecommendation(domain),
        evidenceRefs: [],
        createdAt: new Date().toISOString()
      });
    }
  }

  const domainValues = Object.values(domainScores);
  const totalScore = domainValues.length === 0 ? 0 : Math.round(domainValues.reduce((sum, value) => sum + value, 0) / domainValues.length);

  const snapshot: ScoreSnapshotRecord = {
    id: `${input.assessmentId}-snapshot-${Date.now()}`,
    tenantId: input.tenantId,
    assessmentId: input.assessmentId,
    totalScore,
    domainScores,
    status: scoreToSeverity(totalScore),
    summary: {
      completedQuestions: input.answers.length,
      totalQuestions: QUESTION_BANK.length,
      findingsCount: findings.length,
      evidenceCount: input.evidences.length
    },
    createdAt: new Date().toISOString()
  };

  return {
    snapshot,
    findings
  };
}

export function domainLabel(domain: SecurityDomain) {
  const labels: Record<SecurityDomain, string> = {
    account_access: "账号权限",
    device_baseline: "终端设备",
    email_security: "邮件安全",
    backup_recovery: "备份恢复",
    employee_awareness: "员工意识",
    vendor_collaboration: "供应商协作"
  };
  return labels[domain];
}

function domainRecommendation(domain: SecurityDomain) {
  switch (domain) {
    case "account_access":
      return "优先梳理高权限账号，全面启用 MFA，并建立离职权限回收清单。";
    case "device_baseline":
      return "统一终端杀毒/EDR 覆盖与补丁更新节奏，至少覆盖关键岗位设备。";
    case "email_security":
      return "补齐域名邮件认证，建立员工邮件上报和复盘流程。";
    case "backup_recovery":
      return "对关键数据建立自动备份和季度恢复演练。";
    case "employee_awareness":
      return "建立季度培训和钓鱼演练机制，把高风险岗位列为必修。";
    case "vendor_collaboration":
      return "收敛供应商权限，禁止共用账号，并在合同中补充数据安全条款。";
  }
}
