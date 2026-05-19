import Link from "next/link";
import { ShieldCheck, FileText, Radar, Users } from "lucide-react";

const features = [
  {
    title: "六大域安全体检",
    description: "从账号、终端、邮件、备份、员工意识到供应商协作，形成标准化问卷和分域评分。",
    icon: ShieldCheck
  },
  {
    title: "自动化证据接入",
    description: "首版带 Google Workspace 样板接入，统一证据模型，不让上层页面依赖原始接口。",
    icon: Radar
  },
  {
    title: "报告与复测闭环",
    description: "支持在线仪表盘、PDF 导出、重点发现与整改建议，并保留后续复测能力。",
    icon: FileText
  },
  {
    title: "培训与演练追踪",
    description: "轻量记录培训完成度和钓鱼演练结果，帮助企业把安全体检转化为持续改进。",
    icon: Users
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-panel md:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80">小微企业网络安全体检平台</div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
              把安全咨询的交付感，
              <br />
              做成可复用的 SaaS 产品。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              这版 MVP 已实现企业空间、问卷评估、样板集成、评分、报告导出、培训与钓鱼演练展示，以及平台管理员视图。
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" href="/signin">
                进入演示账号
              </Link>
              <Link className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40" href="/register">
                新建企业空间
              </Link>
            </div>
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              演示账号：`owner@acme-ops.test` / `Password123!`
              <br />
              平台管理员：`security.admin@example.com` / `Admin123!`
            </div>
          </div>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-panel" key={feature.title}>
              <feature.icon className="h-10 w-10 text-ocean" />
              <h2 className="mt-5 text-xl font-semibold text-slate-950">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
