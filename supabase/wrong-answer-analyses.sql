create table if not exists public.wrong_answer_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  source_type text not null check (source_type in ('direct', 'upload', 'database')),
  subject text not null,
  unit text not null,
  question_title text not null,
  wrong_answer text not null,
  correct_answer text not null default '',
  explanation text not null default '',
  pattern text not null,
  confidence integer not null check (confidence between 0 and 100),
  review_direction text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'done')),
  created_at timestamptz not null default now()
);

alter table public.wrong_answer_analyses enable row level security;

create policy "Users can read own wrong answer analyses"
  on public.wrong_answer_analyses
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own wrong answer analyses"
  on public.wrong_answer_analyses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own wrong answer analyses"
  on public.wrong_answer_analyses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists wrong_answer_analyses_user_created_idx
  on public.wrong_answer_analyses (user_id, created_at desc);
