import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCheck,
  FileText,
  Radar,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

const features = [
  {
    title: "六大域安全体检",
    description: "从账号、终端、邮件、备份、员工意识到供应商协作，形成标准化问卷、分域评分与风险画像。",
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

const highlights = [
  { value: "6", label: "安全域统一建模" },
  { value: "1", label: "次评估跑通问卷到报告" },
  { value: "3", label: "类角色可直接协同" }
];

const workflow = [
  {
    title: "先快速建立基线",
    description: "用标准化问卷让交付顾问在第一次沟通时就得到可比较的成熟度基线。"
  },
  {
    title: "再补自动化证据",
    description: "把高价值系统接入进来，让结论不只依赖访谈，而是逐步过渡到可验证事实。"
  },
  {
    title: "最后进入整改复测",
    description: "把一次报告变成连续改进节奏，持续看分数、风险和培训演练变化。"
  }
];

const audiences = [
  "销售演示时，用一页说明产品价值和交付成果。",
  "交付顾问执行首轮体检时，减少口径不一致。",
  "企业负责人复盘风险时，快速抓住优先级和整改顺序。"
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-panel">
          <div className="grid gap-8 p-8 md:p-12 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80">
                <Sparkles className="h-4 w-4" />
                小微企业网络安全体检平台
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
                把一次安全咨询，
                <br />
                变成可持续复购的
                <br />
                产品化体检服务。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                这不是一个只会展示问卷的后台，而是一条从首轮摸底、自动化证据、评分报告到复测追踪的标准化交付链路。
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" href="/signin">
                  进入演示账号
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40" href="/register">
                  新建企业空间
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4" key={item.label}>
                    <div className="text-3xl font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                演示账号：`owner@acme-ops.test` / `Password123!`
                <br />
                平台管理员：`security.admin@example.com` / `Admin123!`
              </div>
            </div>

            <div className="flex items-end">
              <div className="w-full rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Preview</div>
                    <div className="mt-2 text-2xl font-semibold">一次评估，三层交付物</div>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">可持续复测</div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-white p-4 text-slate-950">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-ocean" />
                        <div className="text-sm font-semibold">风险总览与域分</div>
                      </div>
                      <div className="text-sm font-semibold">72 / 100</div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <div className="rounded-2xl bg-slate-100 px-3 py-2">账号权限 68</div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2">邮件安全 74</div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2">备份恢复 81</div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3 text-sm font-semibold">
                      <CheckCheck className="h-5 w-5 text-emerald-300" />
                      整改建议自动沉淀为后续动作
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      报告不只告诉客户“有问题”，而是明确先补管理员 MFA、再收敛邮件策略、最后安排培训与复测。
                    </p>
                  </div>
                  <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                    适合 MVP、演示环境和顾问式交付打磨阶段，先把价值链跑顺，再逐步补深系统集成。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-panel" key={feature.title}>
              <feature.icon className="h-10 w-10 text-ocean" />
              <h2 className="mt-5 text-xl font-semibold text-slate-950">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white/90 p-7 shadow-panel">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Workflow</div>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">把咨询型服务拆成一条可复制流程</h2>
            <div className="mt-6 space-y-4">
              {workflow.map((item, index) => (
                <div className="flex gap-4 rounded-3xl bg-slate-50 p-4" key={item.title}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    0{index + 1}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-950">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-7 shadow-panel">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Who It Helps</div>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">更适合真实业务推进</h2>
            <div className="mt-6 space-y-3">
              {audiences.map((item) => (
                <div className="rounded-3xl border border-slate-200 px-4 py-4 text-sm leading-6 text-slate-600" key={item}>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
              <div className="text-sm text-slate-300">这版 MVP 已支持</div>
              <div className="mt-2 text-lg font-semibold">企业空间、问卷评估、样板集成、评分、报告导出、培训与钓鱼演练展示，以及平台管理员视图。</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
