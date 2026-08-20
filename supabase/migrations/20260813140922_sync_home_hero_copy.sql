update public.site_content
set content = jsonb_build_object(
  'eyebrow', 'JE TIKI · Хабаровск',
  'title', 'Украшения из дерева с берегов Амура',
  'intro', 'Три коллекции о природе, знаках и памяти места. Каждый предмет сделан вручную из массива дальневосточного дерева.',
  'cta', 'Перейти в каталог'
), published = true
where key = 'hero';
