alter table public.vocabulary_draft
  add column if not exists image_prompt text,
  add column if not exists image_prompt_style_version text;
