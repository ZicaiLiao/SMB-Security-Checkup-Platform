import { severityTone } from "@/lib/utils";

export function StatusPill({ label }: { label: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${severityTone(label)}`}>
      {label}
    </span>
  );
}
