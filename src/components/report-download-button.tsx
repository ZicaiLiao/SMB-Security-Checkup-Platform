export function ReportDownloadButton({
  reportId,
  className,
  label = "下载 PDF"
}: {
  reportId: string;
  className?: string;
  label?: string;
}) {
  return (
    <a className={className} href={`/reports/${reportId}/download`}>
      {label}
    </a>
  );
}
