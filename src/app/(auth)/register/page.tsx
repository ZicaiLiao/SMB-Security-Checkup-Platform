import Link from "next/link";
import { Building2, CheckCheck, Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/register-form";

const onboardingSteps = [
  "创建企业空间与 Owner 身份",
  "自动生成首份可填写的体检任务",
  "登录后即可开始评分、出报告和后续复测"
];

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl rounded-[2rem] bg-white/95 p-8 shadow-panel">
        <div className="grid gap-8 md:grid-cols-[1fr_1.15fr]">
          <section className="rounded-[2rem] bg-gradient-to-br from-teal-800 to-slate-950 p-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <Sparkles className="h-4 w-4" />
              新建租户
            </div>
            <h1 className="mt-6 text-3xl font-semibold">为企业创建第一份安全体检</h1>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              创建后会自动生成企业空间、Owner 成员身份，以及一份可立即开始填写的首个体检任务。
            </p>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Building2 className="h-4 w-4 text-emerald-300" />
                创建后你会立刻得到
              </div>
              <div className="mt-4 space-y-3">
                {onboardingSteps.map((item) => (
                  <div className="flex items-center gap-3 text-sm text-slate-200" key={item}>
                    <CheckCheck className="h-4 w-4 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-950">注册企业空间</h2>
            <p className="mt-2 text-sm text-slate-500">首版采用邮箱/密码登录，后续可以再接企业微信或钉钉。当前这一步只需要创建最小可用信息。</p>
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
