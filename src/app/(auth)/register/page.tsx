import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl rounded-[2rem] bg-white/95 p-8 shadow-panel">
        <div className="grid gap-8 md:grid-cols-[1fr_1.15fr]">
          <section className="rounded-[2rem] bg-gradient-to-br from-teal-800 to-slate-950 p-8 text-white">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">新建租户</div>
            <h1 className="mt-6 text-3xl font-semibold">为企业创建第一份安全体检</h1>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              创建后会自动生成企业空间、Owner 成员身份，以及一份可立即开始填写的首个体检任务。
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-950">注册企业空间</h2>
            <p className="mt-2 text-sm text-slate-500">首版采用邮箱/密码登录，后续可以再接企业微信或钉钉。</p>
            <div className="mt-8">
              <RegisterForm />
            </div>
            <div className="mt-6 text-sm text-slate-500">
              已经有账号？
              <Link className="ml-2 font-semibold text-ocean" href="/signin">
                返回登录
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
