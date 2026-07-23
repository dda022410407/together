import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const overviewItems = [
  { label: "분석한 문항", value: "128", note: "이번 주 +18" },
  { label: "감지된 패턴", value: "12", note: "개념 혼동 중심" },
  { label: "복습 대기", value: "34", note: "오늘 확인 권장" },
  { label: "평균 신뢰도", value: "87%", note: "샘플 결과 기준" },
];

const navigationItems = ["분석", "기록", "통계", "설정"];

const recentAnalyses = [
  {
    question: "분수의 나눗셈",
    pattern: "개념 혼동",
    confidence: "91%",
    status: "복습 필요",
  },
  {
    question: "일차방정식",
    pattern: "계산 실수",
    confidence: "84%",
    status: "확인 완료",
  },
  {
    question: "함수 그래프",
    pattern: "조건 누락",
    confidence: "79%",
    status: "분류 보류",
  },
];

export default async function DashboardPage() {
  const { isAuthenticated } = await getSessionState();

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
                <p className="text-sm font-semibold">팀원</p>
                <p className="text-xs text-[var(--muted)]">프론트 담당</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[220px_1fr]">
          <aside className="border border-[var(--line)] bg-white p-3 shadow-sm">
            <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {navigationItems.map((item, index) => (
                <a
                  className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    index === 0
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted)] hover:bg-[var(--app-bg)] hover:text-[var(--app-fg)]"
                  }`}
                  href="#"
                  key={item}
                >
                  {item}
                </a>
              ))}
            </nav>
          </aside>

          <section className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overviewItems.map((item) => (
                <article
                  className="border border-[var(--line)] bg-white p-4 shadow-sm"
                  key={item.label}
                >
                  <p className="text-sm font-medium text-[var(--muted)]">
                    {item.label}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <strong className="text-3xl font-bold">{item.value}</strong>
                    <span className="rounded-lg bg-[var(--app-bg)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                      {item.note}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <section className="border border-[var(--line)] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold">오답 입력</h2>
                  <p className="text-sm text-[var(--muted)]">
                    실제 분석 API 연결 전까지는 샘플 데이터로 화면 흐름만 확인합니다.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">
                    사용자 ID
                    <input
                      className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm font-medium text-[var(--muted)] outline-none"
                      readOnly
                      value="student-001"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    문항 ID
                    <input
                      className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm font-medium text-[var(--muted)] outline-none"
                      readOnly
                      value="math-fraction-24"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                    오답 내용
                    <textarea
                      className="min-h-32 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 text-[var(--muted)] outline-none"
                      readOnly
                      value="3/4 ÷ 1/2 문제에서 분모끼리, 분자끼리 바로 나누어 3/2가 아닌 3/8로 계산했습니다."
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--muted)]">
                    백엔드 연동은 이후 작업에서 별도로 연결합니다.
                  </p>
                  <button
                    className="rounded-lg bg-[var(--disabled)] px-4 py-3 text-sm font-bold text-white"
                    disabled
                    type="button"
                  >
                    분석 요청 준비 중
                  </button>
                </div>
              </section>

              <section className="border border-[var(--line)] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">샘플 분석 결과</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Mock 데이터
                    </p>
                  </div>
                  <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                    대기
                  </span>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-lg border border-[var(--line)] p-4">
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      예측 패턴
                    </p>
                    <p className="mt-2 text-2xl font-bold">개념 혼동</p>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] p-4">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-[var(--muted)]">신뢰도</span>
                      <span>87%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-lg bg-[var(--app-bg)]">
                      <div className="h-2 w-[87%] rounded-lg bg-[var(--accent)]" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--accent-soft)] p-4">
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      추천 복습 방향
                    </p>
                    <p className="mt-2 text-sm leading-6">
                      나눗셈을 역수의 곱셈으로 바꾸는 과정을 먼저 확인하고,
                      계산 규칙과 의미를 함께 비교합니다.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="border border-[var(--line)] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">최근 분석 기록</h2>
                  <p className="text-sm text-[var(--muted)]">
                    샘플 기록으로 리스트 밀도와 상태 표현을 확인합니다.
                  </p>
                </div>
                <span className="text-sm font-semibold text-[var(--accent)]">
                  총 3건
                </span>
              </div>

              <div className="mt-5 overflow-hidden border border-[var(--line)]">
                <div className="hidden grid-cols-[1.2fr_1fr_100px_110px] bg-[var(--app-bg)] px-4 py-3 text-sm font-bold text-[var(--muted)] md:grid">
                  <span>문항</span>
                  <span>패턴</span>
                  <span>신뢰도</span>
                  <span>상태</span>
                </div>
                {recentAnalyses.map((analysis) => (
                  <div
                    className="grid gap-3 border-t border-[var(--line)] px-4 py-4 text-sm md:grid-cols-[1.2fr_1fr_100px_110px] md:items-center"
                    key={analysis.question}
                  >
                    <strong>{analysis.question}</strong>
                    <span className="text-[var(--muted)]">
                      {analysis.pattern}
                    </span>
                    <span className="font-semibold">{analysis.confidence}</span>
                    <span className="rounded-lg bg-[var(--app-bg)] px-2 py-1 text-xs font-bold text-[var(--muted)]">
                      {analysis.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
