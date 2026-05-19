export const SECURITY_DOMAINS = [
  "account_access",
  "device_baseline",
  "email_security",
  "backup_recovery",
  "employee_awareness",
  "vendor_collaboration"
] as const;

export type SecurityDomain = (typeof SECURITY_DOMAINS)[number];

export const MEMBERSHIP_ROLES = ["OWNER", "ADMIN", "VIEWER"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const ASSESSMENT_STATUSES = ["DRAFT", "COLLECTING", "SCORED", "REPORTED", "ARCHIVED"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const FINDING_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "PASS"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export type SystemRole = "STANDARD" | "PLATFORM_ADMIN";
export type StorageMode = "demo" | "prisma";

export type AnswerOption = {
  label: string;
  value: string;
  score: number;
  helpText: string;
};

export type Question = {
  id: string;
  domain: SecurityDomain;
  prompt: string;
  description: string;
  type: "single_select";
  weight: number;
  required: boolean;
  options: AnswerOption[];
};

export type StoredAnswerValue = {
  selectedValue: string;
  selectedLabel: string;
  score: number;
};

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  systemRole: SystemRole;
  createdAt: string;
};

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type MembershipRecord = {
  id: string;
  userId: string;
  tenantId: string;
  role: MembershipRole;
  createdAt: string;
};

export type AssessmentRecord = {
  id: string;
  tenantId: string;
  title: string;
  status: AssessmentStatus;
  sourceMode: "questionnaire" | "hybrid";
  createdAt: string;
  updatedAt: string;
};

export type AnswerRecord = {
  id: string;
  tenantId: string;
  assessmentId: string;
  questionId: string;
  value: StoredAnswerValue;
  updatedAt: string;
};

export type IntegrationConnectionRecord = {
  id: string;
  tenantId: string;
  provider: string;
  status: "connected" | "failed" | "pending";
  externalRef: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceRecord = {
  id: string;
  tenantId: string;
  assessmentId: string;
  domain: SecurityDomain;
  provider: string;
  title: string;
  payload: {
    scoreDelta: number;
    severity?: FindingSeverity;
    impact?: string;
    recommendation?: string;
    evidenceRef?: string;
  };
  createdAt: string;
};

export type RiskFindingRecord = {
  id: string;
  tenantId: string;
  assessmentId: string;
  domain: SecurityDomain;
  severity: FindingSeverity;
  title: string;
  impact: string;
  recommendation: string;
  evidenceRefs: string[];
  createdAt: string;
};

export type ScoreSnapshotRecord = {
  id: string;
  tenantId: string;
  assessmentId: string;
  totalScore: number;
  domainScores: Record<SecurityDomain, number>;
  status: FindingSeverity;
  summary: {
    completedQuestions: number;
    totalQuestions: number;
    findingsCount: number;
    evidenceCount: number;
  };
  createdAt: string;
};

export type ReportRecord = {
  id: string;
  tenantId: string;
  assessmentId: string;
  snapshotId: string;
  generatedAt: string;
  snapshot: {
    tenantName: string;
    assessmentTitle: string;
    totalScore: number;
    status: FindingSeverity;
    domainScores: Record<SecurityDomain, number>;
    findings: RiskFindingRecord[];
    generatedAt: string;
  };
};

export type TrainingCampaignRecord = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  completion: number;
  createdAt: string;
  updatedAt: string;
};

export type PhishingSimulationRecord = {
  id: string;
  tenantId: string;
  name: string;
  template: string;
  employeeCount: number;
  submittedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AuditEventRecord = {
  id: string;
  tenantId: string | null;
  actorUserId: string | null;
  action: string;
  createdAt: string;
  meta: Record<string, string>;
};

export type AssessmentHistoryPoint = {
  assessmentId: string;
  title: string;
  createdAt: string;
  totalScore: number | null;
  status: FindingSeverity | AssessmentStatus;
  deltaFromPrevious: number | null;
};

export type AssessmentComparison = {
  current: AssessmentHistoryPoint | null;
  previous: AssessmentHistoryPoint | null;
  delta: number | null;
};

export type AdminTenantSummary = {
  id: string;
  name: string;
  slug: string;
  assessments: number;
  latestReportAt: string | null;
  latestScore: number | null;
};

export type AdminAuditEvent = AuditEventRecord & {
  tenantName: string | null;
  actorName: string | null;
};

export type AppState = {
  users: UserRecord[];
  tenants: TenantRecord[];
  memberships: MembershipRecord[];
  assessments: AssessmentRecord[];
  answers: AnswerRecord[];
  integrationConnections: IntegrationConnectionRecord[];
  evidences: EvidenceRecord[];
  findings: RiskFindingRecord[];
  scoreSnapshots: ScoreSnapshotRecord[];
  reports: ReportRecord[];
  trainingCampaigns: TrainingCampaignRecord[];
  phishingSimulations: PhishingSimulationRecord[];
  auditEvents: AuditEventRecord[];
};

export type AssessmentDashboard = {
  tenantName: string;
  storageMode: StorageMode;
  assessment: AssessmentRecord;
  answers: AnswerRecord[];
  evidences: EvidenceRecord[];
  findings: RiskFindingRecord[];
  latestSnapshot: ScoreSnapshotRecord | null;
  latestReport: ReportRecord | null;
  questions: Question[];
  trainingCampaigns: TrainingCampaignRecord[];
  phishingSimulations: PhishingSimulationRecord[];
  history: AssessmentHistoryPoint[];
  comparison: AssessmentComparison;
};
