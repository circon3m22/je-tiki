with image_seed(external_url, alt_text, sort_order) as (
  values
    ('https://circon3m22.github.io/je-tiki/images/je-tiki/brooch-bird-on-model.webp', 'Деревянная брошь Птица на модели', 0),
    ('https://circon3m22.github.io/je-tiki/images/je-tiki/brooch-bird-product.webp', 'Деревянная брошь Птица на белом фоне', 1),
    ('https://circon3m22.github.io/je-tiki/images/je-tiki/brooch-bird-card.webp', 'Деревянная брошь Птица на карточке JE TIKI', 2)
)
insert into public.product_images (product_id, external_url, alt_text, sort_order)
select p.id, s.external_url, s.alt_text, s.sort_order
from image_seed s
join public.products p on p.slug = 'brooches-amur-rhythm'
where not exists (
  select 1
  from public.product_images pi
  where pi.product_id = p.id and pi.external_url = s.external_url
);
