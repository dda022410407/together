import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/app/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const loginStats = [
  { label: "분석 준비", value: "3단계" },
  { label: "인증 기준", value: "Supabase" },
  { label: "미리보기", value: "분리 운영" },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8">
        <section className="flex flex-col justify-between gap-10 border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8 lg:min-h-[640px]">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">Together</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              오답을 모으고, 패턴을 분류하고, 다음 복습을 정합니다.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
              학생의 오답 데이터를 기반으로 유형과 취약 단원을 확인하는
              학습 분석 서비스의 로그인 화면입니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {loginStats.map((item) => (
              <article
                className="border border-[var(--line)] bg-[var(--app-bg)] p-4"
                key={item.label}
              >
                <p className="text-sm font-semibold text-[var(--muted)]">
                  {item.label}
                </p>
                <strong className="mt-2 block text-2xl">{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">로그인</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              실제 분석 기능은 Supabase 로그인 이후 대시보드에서 사용합니다.
            </p>
          </div>

          <Suspense
            fallback={
              <p className="mt-6 text-sm text-[var(--muted)]">
                로그인 폼을 준비하는 중입니다.
              </p>
            }
          >
            <LoginForm isSupabaseConfigured={isSupabaseConfigured} />
          </Suspense>

          <div className="mt-6 grid gap-3">
            <Link
              className="rounded-lg border border-[var(--line)] px-4 py-3 text-center text-sm font-bold transition hover:bg-[var(--app-bg)]"
              href="/preview"
            >
              기능 미리보기
            </Link>
            <p className="text-center text-xs leading-5 text-[var(--muted)]">
              미리보기에서는 기능 구성만 확인하고, 입력/분석/기록 기능은
              로그인 후 활성화됩니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
