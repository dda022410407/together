const loginStats = [
  { label: "분석 준비", value: "3단계" },
  { label: "지원 입력", value: "직접 입력" },
  { label: "현재 상태", value: "UI 뼈대" },
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
              아직 인증 연동 전이므로 입력 폼과 화면 흐름만 확인합니다.
            </p>
          </div>

          <form className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              이메일
              <input
                className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                placeholder="team@example.com"
                type="email"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              비밀번호
              <input
                className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
                placeholder="비밀번호 입력"
                type="password"
              />
            </label>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 font-medium text-[var(--muted)]">
                <input
                  className="h-4 w-4 accent-[var(--accent)]"
                  type="checkbox"
                />
                로그인 유지
              </label>
              <a className="font-semibold text-[var(--accent)]" href="#">
                비밀번호 찾기
              </a>
            </div>

            <button
              className="mt-2 rounded-lg bg-[var(--disabled)] px-4 py-3 text-sm font-bold text-white"
              disabled
              type="button"
            >
              로그인 준비 중
            </button>
          </form>

          <div className="mt-6 grid gap-3">
            <a
              className="rounded-lg border border-[var(--line)] px-4 py-3 text-center text-sm font-bold transition hover:bg-[var(--app-bg)]"
              href="/dashboard"
            >
              대시보드 미리보기
            </a>
            <p className="text-center text-xs leading-5 text-[var(--muted)]">
              회원가입과 실제 로그인 처리는 백엔드 인증 정책이 정해진 뒤
              연결합니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
