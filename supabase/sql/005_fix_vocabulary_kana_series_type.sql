do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vocabulary'
      and column_name = 'kana_series'
      and data_type = 'ARRAY'
  ) then
    alter table public.vocabulary
      alter column kana_series type text
      using case
        when kana_series is null then null
        when array_length(kana_series, 1) is null then null
        else kana_series[1]
      end;
  end if;
end $$;

create index if not exists vocabulary_kana_series_idx
  on public.vocabulary (kana_series);
