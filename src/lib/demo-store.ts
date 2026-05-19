import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { QUESTION_BANK } from "@/lib/question-bank";
import {
  AppState,
  AssessmentRecord,
  AuditEventRecord,
  MembershipRecord,
  TenantRecord,
  UserRecord
} from "@/lib/types";
import { slugify } from "@/lib/utils";

const dataDir = path.join(process.cwd(), ".local-data");
const dataFile = path.join(dataDir, "security-checkup-demo.json");

function now() {
  return new Date().toISOString();
}

function userRecord(input: Pick<UserRecord, "email" | "name" | "systemRole"> & { password: string }): UserRecord {
  return {
    id: randomUUID(),
    email: input.email,
    name: input.name,
    passwordHash: bcrypt.hashSync(input.password, 10),
    systemRole: input.systemRole,
    createdAt: now()
  };
}

function tenantRecord(name: string): TenantRecord {
  return {
    id: randomUUID(),
    name,
    slug: slugify(name),
    createdAt: now()
  };
}

function membershipRecord(userId: string, tenantId: string, role: MembershipRecord["role"]): MembershipRecord {
  return {
    id: randomUUID(),
    userId,
    tenantId,
    role,
    createdAt: now()
  };
}

function auditEvent(action: string, tenantId: string | null, actorUserId: string | null, meta: Record<string, string>): AuditEventRecord {
  return {
    id: randomUUID(),
    action,
    tenantId,
    actorUserId,
    createdAt: now(),
    meta
  };
}

function createInitialState(): AppState {
  const demoOwner = userRecord({
    email: "owner@acme-ops.test",
    name: "Acme Ops",
    password: "Password123!",
    systemRole: "STANDARD"
  });
  const platformAdmin = userRecord({
    email: "security.admin@example.com",
    name: "Platform Admin",
    password: "Admin123!",
    systemRole: "PLATFORM_ADMIN"
  });
  const tenant = tenantRecord("Acme Studio");
  const secondTenant = tenantRecord("Northwind Retail");
  const membership = membershipRecord(demoOwner.id, tenant.id, "OWNER");
  const secondMembership = membershipRecord(demoOwner.id, secondTenant.id, "ADMIN");
  const createdAt = now();
  const assessment: AssessmentRecord = {
    id: randomUUID(),
    tenantId: tenant.id,
    title: "2026 Q2 网络安全体检",
    status: "COLLECTING",
    sourceMode: "hybrid",
    createdAt,
    updatedAt: createdAt
  };
  const secondAssessment: AssessmentRecord = {
    id: randomUUID(),
    tenantId: secondTenant.id,
    title: "2026 Q1 安全复测",
    status: "REPORTED",
    sourceMode: "hybrid",
    createdAt,
    updatedAt: createdAt
  };

  const answers = QUESTION_BANK.slice(0, 6).map((question, index) => ({
    id: randomUUID(),
    tenantId: tenant.id,
    assessmentId: assessment.id,
    questionId: question.id,
    value: {
      selectedValue: question.options[index % 2].value,
      selectedLabel: question.options[index % 2].label,
      score: question.options[index % 2].score
    },
    updatedAt: createdAt
  }));

  const trainingCampaigns = [
    {
      id: randomUUID(),
      tenantId: tenant.id,
      name: "季度安全意识培训",
      description: "覆盖密码安全、钓鱼邮件识别和数据分享规范。",
      completion: 68,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: randomUUID(),
      tenantId: secondTenant.id,
      name: "新门店开业前安全培训",
      description: "覆盖门店收银、共享设备和文件访问规则。",
      completion: 92,
      createdAt,
      updatedAt: createdAt
    }
  ];

  const phishingSimulations = [
    {
      id: randomUUID(),
      tenantId: tenant.id,
      name: "财务钓鱼演练",
      template: "伪装发票邮件",
      employeeCount: 18,
      submittedCount: 2,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: randomUUID(),
      tenantId: secondTenant.id,
      name: "门店排班链接演练",
      template: "伪装排班确认通知",
      employeeCount: 24,
      submittedCount: 1,
      createdAt,
      updatedAt: createdAt
    }
  ];

  const secondSnapshot = {
    id: randomUUID(),
    tenantId: secondTenant.id,
    assessmentId: secondAssessment.id,
    totalScore: 81,
    domainScores: {
      account_access: 78,
      device_baseline: 84,
      email_security: 76,
      backup_recovery: 88,
      employee_awareness: 82,
      vendor_collaboration: 79
    },
    status: "LOW" as const,
    summary: {
      completedQuestions: QUESTION_BANK.length,
      totalQuestions: QUESTION_BANK.length,
      findingsCount: 2,
      evidenceCount: 1
    },
    createdAt
  };

  const secondReport = {
    id: randomUUID(),
    tenantId: secondTenant.id,
    assessmentId: secondAssessment.id,
    snapshotId: secondSnapshot.id,
    generatedAt: createdAt,
    snapshot: {
      tenantName: secondTenant.name,
      assessmentTitle: secondAssessment.title,
      totalScore: secondSnapshot.totalScore,
      status: secondSnapshot.status,
      domainScores: secondSnapshot.domainScores,
      findings: [],
      generatedAt: createdAt
    }
  };

  return {
    users: [demoOwner, platformAdmin],
    tenants: [tenant, secondTenant],
    memberships: [membership, secondMembership],
    assessments: [assessment, secondAssessment],
    answers,
    integrationConnections: [],
    evidences: [],
    findings: [],
    scoreSnapshots: [secondSnapshot],
    reports: [secondReport],
    trainingCampaigns,
    phishingSimulations,
    auditEvents: [
      auditEvent("seeded-demo-state", tenant.id, demoOwner.id, {
        assessments: "1",
        questions: String(QUESTION_BANK.length)
      }),
      auditEvent("seeded-demo-state", secondTenant.id, demoOwner.id, {
        assessments: "1",
        questions: String(QUESTION_BANK.length)
      })
    ]
  };
}

function migrateState(state: AppState): AppState {
  const hasSecondTenant = state.tenants.some((tenant) => tenant.slug === slugify("Northwind Retail"));
  if (hasSecondTenant) {
    return state;
  }

  const demoOwner = state.users.find((user) => user.email === "owner@acme-ops.test") ?? state.users[0];
  if (!demoOwner) {
    return state;
  }

  const createdAt = now();
  const secondTenant = tenantRecord("Northwind Retail");
  const secondMembership = membershipRecord(demoOwner.id, secondTenant.id, "ADMIN");
  const secondAssessment: AssessmentRecord = {
    id: randomUUID(),
    tenantId: secondTenant.id,
    title: "2026 Q1 安全复测",
    status: "REPORTED",
    sourceMode: "hybrid",
    createdAt,
    updatedAt: createdAt
  };

  state.tenants.push(secondTenant);
  state.memberships.push(secondMembership);
  state.assessments.push(secondAssessment);
  state.trainingCampaigns.push({
    id: randomUUID(),
    tenantId: secondTenant.id,
    name: "新门店开业前安全培训",
    description: "覆盖门店收银、共享设备和文件访问规则。",
    completion: 92,
    createdAt,
    updatedAt: createdAt
  });
  state.phishingSimulations.push({
    id: randomUUID(),
    tenantId: secondTenant.id,
    name: "门店排班链接演练",
    template: "伪装排班确认通知",
    employeeCount: 24,
    submittedCount: 1,
    createdAt,
    updatedAt: createdAt
  });
  state.scoreSnapshots.push({
    id: randomUUID(),
    tenantId: secondTenant.id,
    assessmentId: secondAssessment.id,
    totalScore: 81,
    domainScores: {
      account_access: 78,
      device_baseline: 84,
      email_security: 76,
      backup_recovery: 88,
      employee_awareness: 82,
      vendor_collaboration: 79
    },
    status: "LOW",
    summary: {
      completedQuestions: QUESTION_BANK.length,
      totalQuestions: QUESTION_BANK.length,
      findingsCount: 2,
      evidenceCount: 1
    },
    createdAt
  });
  state.auditEvents.push(
    auditEvent("demo-migration-second-tenant", secondTenant.id, demoOwner.id, {
      assessments: "1",
      tenant: secondTenant.name
    })
  );
  return state;
}

export async function ensureDemoState() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(createInitialState(), null, 2), "utf8");
  }
}

export async function readState() {
  await ensureDemoState();
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = migrateState(JSON.parse(raw) as AppState);
  await writeState(parsed);
  return parsed;
}

export async function writeState(nextState: AppState) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(nextState, null, 2), "utf8");
}

export async function mutateState<T>(mutator: (draft: AppState) => Promise<T> | T) {
  const state = await readState();
  const result = await mutator(state);
  await writeState(state);
  return result;
}
