alter table public.app_user
add column if not exists total_app_time_seconds integer not null default 0;

create table if not exists public.app_usage_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_user(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  source text not null default 'app',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_usage_session_user_started_idx
  on public.app_usage_session (user_id, started_at desc);
