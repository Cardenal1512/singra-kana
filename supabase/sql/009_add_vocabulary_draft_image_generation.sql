alter table public.vocabulary_draft
  add column if not exists generated_image_path text,
  add column if not exists image_generation_status text not null default 'idle',
  add column if not exists image_generation_error text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vocabulary_draft_image_generation_status_check'
  ) then
    alter table public.vocabulary_draft
      add constraint vocabulary_draft_image_generation_status_check
      check (image_generation_status in ('idle', 'generating', 'generated', 'failed'));
  end if;
end $$;

create index if not exists vocabulary_draft_image_generation_status_idx
  on public.vocabulary_draft (image_generation_status);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'vocabulary-generated',
  'vocabulary-generated',
  true,
  5242880,
  array['image/webp', 'image/png']
) on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
