do $$
begin
  alter table public.kana_series drop constraint if exists kana_series_syllabary_check;
  alter table public.kana_series
    add constraint kana_series_syllabary_check check (syllabary in ('hiragana', 'katakana', 'kanji'));

  alter table public.kana_character drop constraint if exists kana_character_syllabary_check;
  alter table public.kana_character
    add constraint kana_character_syllabary_check check (syllabary in ('hiragana', 'katakana', 'kanji'));
end $$;

insert into public.kana_series (
  id,
  title,
  subtitle,
  representative_kana,
  display_order,
  enabled,
  created_at,
  syllabary
)
select
  'hiragana-' || id,
  title,
  subtitle,
  representative_kana,
  display_order,
  enabled,
  created_at,
  'hiragana'
from public.kana_series
where syllabary = 'hiragana'
  and id not like 'hiragana-%'
on conflict (id) do nothing;

update public.kana_character
set series_id = 'hiragana-' || series_id,
    syllabary = 'hiragana'
where syllabary = 'hiragana'
  and series_id not like 'hiragana-%';

update public.vocabulary
set kana_series = 'hiragana-' || kana_series,
    writing_system = 'hiragana'
where writing_system = 'hiragana'
  and kana_series is not null
  and kana_series not like 'hiragana-%';

update public.kana_character
set id = 'hiragana-' || id,
    syllabary = 'hiragana'
where syllabary = 'hiragana'
  and id not like 'hiragana-%';

delete from public.kana_series
where syllabary = 'hiragana'
  and id not like 'hiragana-%';
