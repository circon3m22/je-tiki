insert into public.collections (slug, name, description, published)
values
  ('amur-rhythm', 'В ритме Амура', 'Орнамент как современный язык великой реки и народов Приамурья.', true),
  ('seven-guardians', 'Сэвэны-хранители', 'Символические помощники, вдохновлённые культовой скульптурой Приамурья.', true),
  ('on-the-way', 'На Пути', 'Простая геометрия и живой рисунок дальневосточного дерева.', true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, published = excluded.published;

insert into public.site_content (key, content, published)
values
  ('home_intro', '{"eyebrow":"О JE TIKI","title":"Современные предметы, в которых слышен Дальний Восток.","paragraph1":"Мы работаем с японским вязом и другими дальневосточными породами. Сохраняем рисунок дерева — он делает каждую вещь единственной.","paragraph2":"Источники форм — нанайский орнамент, природа Приамурья и простая геометрия."}'::jsonb, true),
  ('collection_amur', '{"number":"01","line":"Орнамент как язык","title":"В ритме Амура","description":"Ритм великой реки, таёжная свобода и знаки народов Приамурья превращаются в лёгкие украшения из дерева."}'::jsonb, true),
  ('collection_guardians', '{"number":"02","line":"Символические помощники","title":"Сэвэны-хранители","description":"Образы, вдохновлённые культовой скульптурой народов Приамурья."}'::jsonb, true),
  ('collection_path', '{"number":"03","line":"Простая форма, живое дерево","title":"На Пути","description":"Миниатюрные браслеты, пуссеты и подвески сохраняют естественный рисунок древесины."}'::jsonb, true),
  ('craft', '{"eyebrow":"Материал","title":"Дерево уже содержит рисунок. Мы только помогаем ему стать предметом.","text":"Массив японского вяза, ручная шлифовка, безопасные масла и воски. Малые тиражи сохраняют индивидуальность каждого фрагмента."}'::jsonb, true)
on conflict (key) do nothing;

update public.site_content
set content = content || '{"intro":"Три коллекции о природе, знаках и памяти места. Каждый предмет сделан вручную из массива дальневосточного дерева."}'::jsonb
where key = 'hero';

update public.site_content
set content = content || '{"eyebrow":"Мастерская","paragraph1":"Тёплые, тактильные вещи с локальным характером — для повседневной жизни, подарка и памяти о месте.","paragraph2":"Кроме украшений мы создаём сувениры и небольшие серии для событий и бизнеса."}'::jsonb
where key = 'about';

update public.site_content
set content = content || '{"instagram_url":"https://instagram.com/je_tiki","footer_text":"Украшения из дерева с берегов Амура"}'::jsonb
where key = 'contacts';
