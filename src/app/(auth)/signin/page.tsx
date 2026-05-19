import Link from "next/link";
import { SignInForm } from "@/components/signin-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl gap-6 rounded-[2rem] bg-white/90 p-6 shadow-panel md:grid-cols-[1.1fr_0.9fr] md:p-8">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">安全体检登录</div>
          <h1 className="mt-6 text-3xl font-semibold">进入企业体检工作台</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            适合给销售演示、交付顾问试用，也适合作为正式 SaaS 的起点。登录后即可查看体检任务、评分结果与报告导出。
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            演示企业：owner@acme-ops.test
            <br />
            演示密码：Password123!
          </div>
        </section>
        <section className="rounded-[2rem] bg-slate-50 p-8">
          <h2 className="text-2xl font-semibold text-slate-950">欢迎回来</h2>
          <p className="mt-2 text-sm text-slate-500">用邮箱和密码登录企业空间。</p>
          <div className="mt-8">
            <SignInForm />
          </div>
          <div className="mt-6 text-sm text-slate-500">
            还没有企业空间？
            <Link className="ml-2 font-semibold text-ocean" href="/register">
              立即创建
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
