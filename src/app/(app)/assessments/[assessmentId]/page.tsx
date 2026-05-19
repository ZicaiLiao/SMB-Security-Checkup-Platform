import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AssessmentWorkspace } from "@/components/assessment-workspace";
import { getAssessmentDashboard, getUserContext } from "@/lib/repository";
import { resolveCurrentTenant, requireAppSession } from "@/lib/session";

export default async function AssessmentPage({ params }: { params: { assessmentId: string } }) {
  const session = await requireAppSession();
  if (!session) {
    redirect("/signin");
  }
  const tenantMembership = await resolveCurrentTenant(session);
  if (!tenantMembership) {
    redirect("/signin");
  }

  const [dashboard, userContext] = await Promise.all([
    getAssessmentDashboard(tenantMembership.tenantId, params.assessmentId),
    getUserContext(session.user.id)
  ]);
  if (!dashboard) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link className="text-sm font-semibold text-ocean" href="/dashboard">
            返回体检列表
          </Link>
        </div>
        <AssessmentWorkspace
          dashboard={dashboard}
          memberships={userContext?.memberships ?? []}
          tenants={userContext?.tenants ?? []}
        />
      </div>
    </main>
  );
}
