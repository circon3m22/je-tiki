insert into public.site_content (key, content, published)
values (
  'city_wood',
  '{"eyebrow":"Материал с адресом","title":"Город продолжает жить в дереве.","text":"Часть материала JE TIKI — древесина японских вязов, которые удаляют в Хабаровске как аварийные деревья. Мы отбираем пригодные фрагменты и забираем их в мастерскую.","note":"Вместо того чтобы оказаться среди отходов, дерево получает новую форму — украшения и небольшие объекты, сделанные в том же городе, где оно росло."}'::jsonb,
  true
)
on conflict (key) do update
set content = excluded.content,
    published = excluded.published;
