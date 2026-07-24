create table if not exists public.wrong_answer_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  source_type text not null check (source_type in ('direct', 'upload', 'database')),
  image_path text,
  image_url text,
  subject text not null,
  unit text not null,
  question_title text not null,
  problem_statement text not null default '',
  wrong_answer text not null,
  correct_answer text not null default '',
  provided_solution text not null default '',
  explanation text not null default '',
  pattern text not null,
  confidence integer not null check (confidence between 0 and 100),
  correct_solution text not null default '',
  detailed_explanation text not null default '',
  mistake_reason text not null default '',
  review_direction text not null,
  review_topics text[] not null default '{}',
  solution_steps text[] not null default '{}',
  solution_strategy text not null default '',
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'done')),
  created_at timestamptz not null default now()
);

alter table public.wrong_answer_analyses
  add column if not exists image_path text,
  add column if not exists image_url text,
  add column if not exists problem_statement text not null default '',
  add column if not exists provided_solution text not null default '',
  add column if not exists correct_solution text not null default '',
  add column if not exists detailed_explanation text not null default '',
  add column if not exists mistake_reason text not null default '',
  add column if not exists review_topics text[] not null default '{}',
  add column if not exists solution_steps text[] not null default '{}',
  add column if not exists solution_strategy text not null default '';

update public.wrong_answer_analyses
set problem_statement = question_title
where problem_statement = '';

update public.wrong_answer_analyses
set
  pattern = '정확 풀이 미지원',
  confidence = least(confidence, 58),
  correct_solution = concat(
    '현재 저장된 문제 내용만으로는 정답이 왜 그 값인지 정확히 계산해 설명할 수 없습니다.',
    E'\n정확한 풀이를 표시하려면 문제 본문을 텍스트로 입력하거나 AI 이미지 풀이 엔진을 연결해야 합니다.'
  ),
  detailed_explanation = '',
  mistake_reason = '문제 본문 또는 이미지의 수학 정보가 충분하지 않아 오답 원인을 단정하지 않습니다.',
  review_direction = '정확한 문제 본문 입력, OCR, 또는 AI 풀이 엔진 연결이 필요합니다.',
  review_topics = array['풀이 엔진 연결 필요'],
  solution_steps = '{}',
  solution_strategy = ''
where
  problem_statement in ('img.png', '다운로드.webp', '사진에 있음.')
  or correct_solution like '%문제에서 구해야 하는 값을 먼저 표시합니다%'
  or detailed_explanation like '%어느 단계에서 생각이 달라졌는지 확인합니다%';

alter table public.wrong_answer_analyses enable row level security;

drop policy if exists "Users can read own wrong answer analyses"
  on public.wrong_answer_analyses;
drop policy if exists "Users can insert own wrong answer analyses"
  on public.wrong_answer_analyses;
drop policy if exists "Users can update own wrong answer analyses"
  on public.wrong_answer_analyses;

create policy "Users can read own wrong answer analyses"
  on public.wrong_answer_analyses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own wrong answer analyses"
  on public.wrong_answer_analyses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own wrong answer analyses"
  on public.wrong_answer_analyses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists wrong_answer_analyses_user_created_idx
  on public.wrong_answer_analyses (user_id, created_at desc);

create table if not exists public.user_analysis_settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  default_subject text not null default '수학',
  default_source_type text not null default 'direct'
    check (default_source_type in ('direct', 'upload', 'database')),
  auto_select_new_record boolean not null default true,
  show_sample_records boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_analysis_settings enable row level security;

drop policy if exists "Users can read own analysis settings"
  on public.user_analysis_settings;
drop policy if exists "Users can insert own analysis settings"
  on public.user_analysis_settings;
drop policy if exists "Users can update own analysis settings"
  on public.user_analysis_settings;

create policy "Users can read own analysis settings"
  on public.user_analysis_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own analysis settings"
  on public.user_analysis_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own analysis settings"
  on public.user_analysis_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('wrong-answer-images', 'wrong-answer-images', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own wrong answer images"
  on storage.objects;
drop policy if exists "Users can read wrong answer images"
  on storage.objects;
drop policy if exists "Users can update own wrong answer images"
  on storage.objects;

create policy "Users can upload own wrong answer images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'wrong-answer-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update own wrong answer images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'wrong-answer-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'wrong-answer-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
