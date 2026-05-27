create table if not exists public.app_user_credentials (
  user_id uuid primary key references public.app_user(id) on delete cascade,
  pin_hash text not null,
  pin_salt text,
  pin_algorithm text not null default 'bcrypt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_user_credentials enable row level security;

revoke all on table public.app_user_credentials from anon;
revoke all on table public.app_user_credentials from authenticated;

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
  updated_at = now();

insert into public.app_user_credentials (
  user_id,
  pin_hash,
  pin_algorithm
)
select
  id,
  '$2b$10$YJ9DpDstGkhAJ.s/aXnFaOehpswgAZ5FxVVnZWz65uzwcTw0QBQf.',
  'bcrypt'
from public.app_user
where username = 'adri'
on conflict (user_id) do update
set
  pin_hash = excluded.pin_hash,
  pin_algorithm = excluded.pin_algorithm,
  updated_at = now();
