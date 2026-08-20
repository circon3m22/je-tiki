update public.site_content
set content = jsonb_build_object(
  'phone', '89147771252',
  'footer_text', coalesce(content ->> 'footer_text', 'Украшения из дерева с берегов Амура')
)
where key = 'contacts';
