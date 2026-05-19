create table if not exists public.vocabulary_draft (
  id uuid primary key default gen_random_uuid(),
  japanese text not null,
  reading_kana text not null,
  romaji text[] not null default '{}',
  meaning_es text,
  meaning_en text,
  main_kana text not null,
  kana_series text,
  writing_system text not null default 'hiragana',
  status text not null default 'draft',
  source text not null default 'manual',
  image_prompt text,
  generated_image_path text,
  approved_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vocabulary_draft_writing_system_check
    check (writing_system in ('hiragana', 'katakana', 'kanji', 'mixed')),
  constraint vocabulary_draft_status_check
    check (status in ('draft', 'pending_image', 'ready_for_review', 'approved', 'rejected')),
  constraint vocabulary_draft_source_check
    check (source in ('manual'))
);

create index if not exists vocabulary_draft_status_idx
  on public.vocabulary_draft (status);

create index if not exists vocabulary_draft_writing_system_idx
  on public.vocabulary_draft (writing_system);

create index if not exists vocabulary_draft_kana_series_idx
  on public.vocabulary_draft (kana_series);
