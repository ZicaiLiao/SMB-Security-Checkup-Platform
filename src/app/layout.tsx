import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://smb-security-checkup.local"),
  title: {
    default: "SMB Security Checkup",
    template: "%s | SMB Security Checkup"
  },
  description: "小微企业网络安全体检平台 MVP，覆盖问卷体检、自动评分、报告导出、培训演练和复测闭环。",
  applicationName: "SMB Security Checkup"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
