create table if not exists public.app_user (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  avatar_key text,
  preferred_language text not null default 'es',
  current_syllabary text not null default 'hiragana',
  current_level text not null default 'beginner',
  daily_goal_minutes integer not null default 10,
  daily_goal_lessons integer not null default 1,
  streak_days integer not null default 0,
  total_practice_days integer not null default 0,
  total_practice_sessions integer not null default 0,
  total_practice_time_seconds integer not null default 0,
  last_practiced_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.app_user(id) on delete cascade,
  sound_enabled boolean not null default true,
  music_enabled boolean not null default true,
  haptics_enabled boolean not null default true,
  romaji_enabled boolean not null default true,
  show_hints boolean not null default true,
  left_handed_mode boolean not null default false,
  ai_feedback_enabled boolean not null default true,
  theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_user_username_idx
  on public.app_user (username);

insert into public.app_user (
  username,
  display_name,
  preferred_language,
  current_syllabary,
  current_level
)
values (
  'adri',
  'Adri',
  'es',
  'hiragana',
  'beginner'
)
on conflict (username) do update
set
  display_name = excluded.display_name,
  preferred_language = excluded.preferred_language,
  current_syllabary = excluded.current_syllabary,
  current_level = excluded.current_level,
  updated_at = now();

insert into public.user_settings (user_id)
select id
from public.app_user
where username = 'adri'
on conflict (user_id) do nothing;
