alter table public.vocabulary_draft
  add column if not exists image_prompt_reference_bucket text,
  add column if not exists image_prompt_reference_path text;
