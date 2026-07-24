import { redirect } from "next/navigation";
import { DashboardWorkspace } from "@/app/dashboard/dashboard-workspace";
import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { getSessionState } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { email, isAuthenticated } = await getSessionState();

  if (!isAuthenticated) {
    redirect("/?next=/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">
              Together
            </p>
            <h1 className="text-2xl font-bold text-[var(--app-fg)]">
              오답 분석 대시보드
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              로그인 세션 확인됨
            </span>
            <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                T
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">로그인 사용자</p>
                <p className="text-xs text-[var(--muted)]">
                  {email ?? "Supabase Auth"}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </header>

        <DashboardWorkspace userEmail={email} />
      </div>
    </main>
  );
}
