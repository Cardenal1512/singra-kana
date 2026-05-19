create table if not exists public.vocabulary (
  id text primary key,
  kana text not null,
  writing_system text not null default 'hiragana',
  japanese text not null,
  romaji text[] not null default '{}',
  meaning_es text,
  meaning_en text,
  image_path text,
  category text,
  kana_series text,
  source text not null default 'official' check (source in ('official', 'user')),
  constraint vocabulary_writing_system_check check (writing_system in ('hiragana', 'katakana', 'kanji', 'mixed')),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.vocabulary add column if not exists kana text;
alter table public.vocabulary add column if not exists source text;
alter table public.vocabulary add column if not exists writing_system text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vocabulary'
      and column_name = 'romaji'
      and data_type <> 'ARRAY'
  ) then
    alter table public.vocabulary
      alter column romaji type text[]
      using case
        when romaji is null then '{}'::text[]
        else array[romaji]::text[]
      end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vocabulary'
      and column_name = 'is_official'
  ) then
    update public.vocabulary
    set source = case
      when is_official is false then 'user'
      else 'official'
    end
    where source is null;
  end if;
end $$;

update public.vocabulary
set source = 'official'
where source is null;

update public.vocabulary
set writing_system = 'hiragana'
where writing_system is null;

alter table public.vocabulary alter column source set default 'official';
alter table public.vocabulary alter column source set not null;
alter table public.vocabulary alter column writing_system set default 'hiragana';
alter table public.vocabulary alter column writing_system set not null;
alter table public.vocabulary alter column romaji set default '{}';
alter table public.vocabulary alter column romaji set not null;
alter table public.vocabulary alter column approved set default true;
alter table public.vocabulary alter column approved set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vocabulary_source_check'
      and conrelid = 'public.vocabulary'::regclass
  ) then
    alter table public.vocabulary
      add constraint vocabulary_source_check check (source in ('official', 'user'));
  end if;
end $$;

create index if not exists vocabulary_approved_idx on public.vocabulary (approved);
create index if not exists vocabulary_writing_system_approved_idx on public.vocabulary (writing_system, approved);
create index if not exists vocabulary_kana_idx on public.vocabulary (kana);
create index if not exists vocabulary_source_idx on public.vocabulary (source);
