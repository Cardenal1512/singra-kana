create table if not exists public.practice_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_user(id) on delete cascade,
  practice_mode text not null,
  syllabary text not null default 'hiragana',
  series_id text,
  series_title text,
  started_at timestamptz not null,
  completed_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  wrong_attempts integer not null default 0,
  average_score numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.practice_attempt (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_session(id) on delete cascade,
  user_id uuid not null references public.app_user(id) on delete cascade,
  practice_mode text not null,
  target_type text not null check (target_type in ('kana', 'vocabulary')),
  target_id text not null,
  kana text,
  romaji text,
  expected_answer text,
  user_answer text,
  is_correct boolean not null default false,
  score numeric,
  duration_ms integer,
  attempt_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  attempted_at timestamptz not null default now()
);

create table if not exists public.kana_progress (
  user_id uuid not null references public.app_user(id) on delete cascade,
  kana text not null,
  syllabary text not null default 'hiragana',
  attempts_count integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  best_score numeric,
  average_score numeric,
  mastered boolean not null default false,
  first_practiced_at timestamptz,
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, kana, syllabary)
);

create table if not exists public.vocabulary_progress (
  user_id uuid not null references public.app_user(id) on delete cascade,
  vocabulary_id text not null,
  attempts_count integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  last_answer text,
  first_practiced_at timestamptz,
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, vocabulary_id)
);

create index if not exists practice_session_user_completed_idx
  on public.practice_session (user_id, completed_at desc);

create index if not exists practice_attempt_user_target_idx
  on public.practice_attempt (user_id, target_type, target_id, attempted_at desc);

create index if not exists practice_attempt_session_idx
  on public.practice_attempt (session_id, attempt_order);

create index if not exists kana_progress_user_mastered_idx
  on public.kana_progress (user_id, mastered, last_practiced_at desc);
