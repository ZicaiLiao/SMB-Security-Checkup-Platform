import { readFile } from "node:fs/promises";

import * as fontkit from "fontkit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { AssessmentDashboard, SecurityDomain } from "@/lib/types";
import { domainLabel } from "@/lib/scoring";

function asciiSafeText(value: string, fallback: string) {
  const sanitized = value.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
  return sanitized || fallback;
}

function pdfDomainLabel(domain: SecurityDomain) {
  const labels: Record<SecurityDomain, string> = {
    account_access: "Account Access",
    device_baseline: "Device Baseline",
    email_security: "Email Security",
    backup_recovery: "Backup & Recovery",
    employee_awareness: "Employee Awareness",
    vendor_collaboration: "Vendor Collaboration"
  };
  return labels[domain];
}

const SYSTEM_CHINESE_FONT_PATH = "/System/Library/Fonts/Supplemental/NotoSansKaithi-Regular.ttf";
let cachedChineseFontBytes: Uint8Array | null = null;

async function loadChineseFontBytes() {
  if (cachedChineseFontBytes) {
    return cachedChineseFontBytes;
  }
  cachedChineseFontBytes = await readFile(SYSTEM_CHINESE_FONT_PATH);
  return cachedChineseFontBytes;
}

export async function buildReportPdf(dashboard: AssessmentDashboard, tenantName: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  let font = await pdf.embedFont(StandardFonts.Helvetica);
  let bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let canRenderChinese = false;

  try {
    pdf.registerFontkit(fontkit);
    const fontBytes = await loadChineseFontBytes();
    font = await pdf.embedFont(fontBytes, { subset: false });
    bold = font;
    canRenderChinese = true;
  } catch {
    canRenderChinese = false;
  }

  const snapshot = dashboard.latestSnapshot;
  const domainScores = snapshot?.domainScores ?? {};
  const renderText = (value: string, fallback: string) => (canRenderChinese ? value : asciiSafeText(value, fallback));
  const renderDomainLabel = (domain: SecurityDomain) => (canRenderChinese ? domainLabel(domain) : pdfDomainLabel(domain));

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: rgb(0.96, 0.98, 1)
  });
  page.drawText("SMB Security Checkup Report", {
    x: 48,
    y: 540,
    size: 24,
    font: bold,
    color: rgb(0.04, 0.23, 0.32)
  });
  page.drawText(renderText(tenantName, "Tenant Workspace"), {
    x: 48,
    y: 512,
    size: 16,
    font
  });
  page.drawText(renderText(dashboard.assessment.title, "Security Assessment"), {
    x: 48,
    y: 490,
    size: 13,
    font,
    color: rgb(0.35, 0.39, 0.47)
  });

  page.drawRectangle({
    x: 48,
    y: 390,
    width: 220,
    height: 70,
    color: rgb(0.06, 0.46, 0.43)
  });
  page.drawText(String(snapshot?.totalScore ?? 0), {
    x: 72,
    y: 420,
    size: 30,
    font: bold,
    color: rgb(1, 1, 1)
  });
  page.drawText(`Overall Status: ${snapshot?.status ?? "N/A"}`, {
    x: 72,
    y: 400,
    size: 12,
    font,
    color: rgb(1, 1, 1)
  });

  let currentY = 350;
  for (const [domain, value] of Object.entries(domainScores)) {
    page.drawText(`${renderDomainLabel(domain as SecurityDomain)}: ${value}`, {
      x: 48,
      y: currentY,
      size: 12,
      font
    });
    currentY -= 18;
  }

  page.drawText("Top Findings", {
    x: 330,
    y: 450,
    size: 16,
    font: bold
  });

  let findingY = 425;
  for (const finding of dashboard.findings.slice(0, 5)) {
    page.drawText(`${finding.severity} | ${renderText(finding.title, "Security finding")}`, {
      x: 330,
      y: findingY,
      size: 11,
      font: bold,
      color: rgb(0.56, 0.1, 0.15)
    });
    findingY -= 15;
    page.drawText(renderText(finding.recommendation, "See dashboard for remediation details."), {
      x: 330,
      y: findingY,
      size: 10,
      font,
      maxWidth: 430,
      lineHeight: 12
    });
    findingY -= 28;
  }

  return pdf.save();
}
