import * as demo from "@/lib/repository-demo";
import * as prismaRepo from "@/lib/repository-prisma";

async function shouldUsePrismaBackend() {
  return (await prismaRepo.getStorageMode()) === "prisma";
}

export async function getStorageMode() {
  return (await shouldUsePrismaBackend()) ? prismaRepo.getStorageMode() : demo.getStorageMode();
}

export async function findUserByEmail(email: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.findUserByEmail(email) : demo.findUserByEmail(email);
}

export async function createTenantOwner(input: Parameters<typeof demo.createTenantOwner>[0]) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.createTenantOwner(input) : demo.createTenantOwner(input);
}

export async function getUserContext(userId: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.getUserContext(userId) : demo.getUserContext(userId);
}

export async function listAssessments(tenantId: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.listAssessments(tenantId) : demo.listAssessments(tenantId);
}

export async function createAssessment(tenantId: string, title: string, actorUserId?: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.createAssessment(tenantId, title, actorUserId) : demo.createAssessment(tenantId, title, actorUserId);
}

export async function getAssessmentById(tenantId: string, assessmentId: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.getAssessmentById(tenantId, assessmentId) : demo.getAssessmentById(tenantId, assessmentId);
}

export async function updateAssessment(
  tenantId: string,
  assessmentId: string,
  patch: Parameters<typeof demo.updateAssessment>[2],
  actorUserId?: string
) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.updateAssessment(tenantId, assessmentId, patch, actorUserId)
    : demo.updateAssessment(tenantId, assessmentId, patch, actorUserId);
}

export async function upsertAnswer(
  tenantId: string,
  assessmentId: string,
  questionId: string,
  value: Parameters<typeof demo.upsertAnswer>[3],
  actorUserId?: string
) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.upsertAnswer(tenantId, assessmentId, questionId, value, actorUserId)
    : demo.upsertAnswer(tenantId, assessmentId, questionId, value, actorUserId);
}

export async function connectGoogleWorkspace(tenantId: string, assessmentId: string, actorUserId?: string) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.connectGoogleWorkspace(tenantId, assessmentId, actorUserId)
    : demo.connectGoogleWorkspace(tenantId, assessmentId, actorUserId);
}

export async function scoreAssessment(tenantId: string, assessmentId: string, actorUserId?: string) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.scoreAssessment(tenantId, assessmentId, actorUserId)
    : demo.scoreAssessment(tenantId, assessmentId, actorUserId);
}

export async function createReport(tenantId: string, assessmentId: string, actorUserId?: string) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.createReport(tenantId, assessmentId, actorUserId)
    : demo.createReport(tenantId, assessmentId, actorUserId);
}

export async function getAssessmentDashboard(tenantId: string, assessmentId: string) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.getAssessmentDashboard(tenantId, assessmentId)
    : demo.getAssessmentDashboard(tenantId, assessmentId);
}

export async function getReportById(tenantId: string, reportId: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.getReportById(tenantId, reportId) : demo.getReportById(tenantId, reportId);
}

export async function getReportByIdForTenants(reportId: string, tenantIds: string[]) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.getReportByIdForTenants(reportId, tenantIds)
    : demo.getReportByIdForTenants(reportId, tenantIds);
}

export async function listTrainingCampaigns(tenantId: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.listTrainingCampaigns(tenantId) : demo.listTrainingCampaigns(tenantId);
}

export async function createTrainingCampaign(
  tenantId: string,
  input: Parameters<typeof demo.createTrainingCampaign>[1],
  actorUserId?: string
) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.createTrainingCampaign(tenantId, input, actorUserId)
    : demo.createTrainingCampaign(tenantId, input, actorUserId);
}

export async function listPhishingSimulations(tenantId: string) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.listPhishingSimulations(tenantId) : demo.listPhishingSimulations(tenantId);
}

export async function createPhishingSimulation(
  tenantId: string,
  input: Parameters<typeof demo.createPhishingSimulation>[1],
  actorUserId?: string
) {
  return (await shouldUsePrismaBackend())
    ? prismaRepo.createPhishingSimulation(tenantId, input, actorUserId)
    : demo.createPhishingSimulation(tenantId, input, actorUserId);
}

export async function listTenantsForAdmin() {
  return (await shouldUsePrismaBackend()) ? prismaRepo.listTenantsForAdmin() : demo.listTenantsForAdmin();
}

export async function listAuditEventsForAdmin(limit?: number) {
  return (await shouldUsePrismaBackend()) ? prismaRepo.listAuditEventsForAdmin(limit) : demo.listAuditEventsForAdmin(limit);
}
