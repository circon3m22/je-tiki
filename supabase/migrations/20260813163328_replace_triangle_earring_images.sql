delete from public.product_images
where product_id = (
  select id from public.products where slug = 'studs-triangle'
);

with image_seed(external_url, alt_text, sort_order) as (
  values
    ('https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-on-model.webp', 'Пуссета Треугольник на модели', 0),
    ('https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-white-box.webp', 'Пуссеты Треугольник на белом фоне, вид спереди и сбоку', 1),
    ('https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-card-new.webp', 'Пуссеты Треугольник на карточке JE TIKI', 2)
)
insert into public.product_images (product_id, external_url, alt_text, sort_order)
select p.id, s.external_url, s.alt_text, s.sort_order
from image_seed s
join public.products p on p.slug = 'studs-triangle';
