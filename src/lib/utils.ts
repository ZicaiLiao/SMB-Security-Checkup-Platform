import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tenant";
}

export function scoreToSeverity(score: number) {
  if (score >= 85) {
    return "PASS" as const;
  }
  if (score >= 70) {
    return "LOW" as const;
  }
  if (score >= 50) {
    return "MEDIUM" as const;
  }
  if (score >= 30) {
    return "HIGH" as const;
  }
  return "CRITICAL" as const;
}

export function severityTone(severity: string) {
  switch (severity) {
    case "PASS":
      return "bg-emerald-100 text-emerald-700";
    case "REPORTED":
      return "bg-emerald-100 text-emerald-700";
    case "LOW":
      return "bg-teal-100 text-teal-700";
    case "SCORED":
      return "bg-cyan-100 text-cyan-700";
    case "MEDIUM":
      return "bg-amber-100 text-amber-700";
    case "COLLECTING":
      return "bg-sky-100 text-sky-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "ARCHIVED":
      return "bg-slate-200 text-slate-700";
    case "TENANT":
      return "bg-slate-100 text-slate-700";
    case "SYSTEM":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-rose-100 text-rose-700";
  }
}

export function roleCanEdit(role: string) {
  return role === "OWNER" || role === "ADMIN";
}
