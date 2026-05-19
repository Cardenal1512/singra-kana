alter table public.kana_series
  add column if not exists syllabary text;

update public.kana_series
set syllabary = 'hiragana'
where syllabary is null;

alter table public.kana_series
  alter column syllabary set default 'hiragana',
  alter column syllabary set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'kana_series_syllabary_check'
      and conrelid = 'public.kana_series'::regclass
  ) then
    alter table public.kana_series
      add constraint kana_series_syllabary_check check (syllabary in ('hiragana', 'katakana'));
  end if;
end $$;

create index if not exists kana_series_syllabary_enabled_order_idx
  on public.kana_series (syllabary, enabled, display_order);

alter table public.kana_character
  add column if not exists syllabary text;

update public.kana_character
set syllabary = 'hiragana'
where syllabary is null;

alter table public.kana_character
  alter column syllabary set default 'hiragana',
  alter column syllabary set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'kana_character_syllabary_check'
      and conrelid = 'public.kana_character'::regclass
  ) then
    alter table public.kana_character
      add constraint kana_character_syllabary_check check (syllabary in ('hiragana', 'katakana'));
  end if;
end $$;

create index if not exists kana_character_syllabary_series_enabled_order_idx
  on public.kana_character (syllabary, series_id, enabled, display_order);

alter table public.vocabulary
  add column if not exists writing_system text;

update public.vocabulary
set writing_system = 'hiragana'
where writing_system is null;

alter table public.vocabulary
  alter column writing_system set default 'hiragana',
  alter column writing_system set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vocabulary_writing_system_check'
      and conrelid = 'public.vocabulary'::regclass
  ) then
    alter table public.vocabulary
      add constraint vocabulary_writing_system_check
      check (writing_system in ('hiragana', 'katakana', 'kanji', 'mixed'));
  end if;
end $$;

create index if not exists vocabulary_writing_system_approved_idx
  on public.vocabulary (writing_system, approved);
