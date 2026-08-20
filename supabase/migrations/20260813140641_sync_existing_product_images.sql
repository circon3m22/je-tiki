create or replace function private.enforce_product_image_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.product_images where product_id = new.product_id) >= 10 then
    raise exception 'Для одного товара можно добавить не более 10 фотографий';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_product_image_limit() from public, anon, authenticated;

drop trigger if exists product_images_limit_10 on public.product_images;
create trigger product_images_limit_10
before insert on public.product_images
for each row execute function private.enforce_product_image_limit();

with image_seed(slug, external_url, alt_text, sort_order) as (
  values
    ('earrings-spiral', 'https://circon3m22.github.io/je-tiki/images/je-tiki/spiral-on-model.jpg', 'Серьги Спирали на модели', 0),
    ('earrings-spiral', 'https://circon3m22.github.io/je-tiki/images/je-tiki/spiral-packaging.jpeg', 'Серьги Спирали в упаковке', 1),
    ('studs-triangle', 'https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-studs.jpg', 'Пуссеты Треугольник', 0),
    ('studs-triangle', 'https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-card.jpg', 'Пуссеты Треугольник на карточке', 1),
    ('studs-triangle', 'https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-on-model.jpg', 'Пуссеты Треугольник на модели', 2),
    ('studs-amur-rhythm', 'https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-card.jpg', 'Пуссеты Ритм Амура на карточке', 0),
    ('studs-amur-rhythm', 'https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-studs.jpg', 'Пуссеты Ритм Амура', 1),
    ('studs-amur-rhythm', 'https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-on-model.jpg', 'Пуссеты Ритм Амура на модели', 2),
    ('amulet-seven-guardians', 'https://circon3m22.github.io/je-tiki/images/je-tiki/seven-guardians.jpg', 'Амулет Сэвэны-хранители', 0),
    ('amulet-seven-guardians', 'https://circon3m22.github.io/je-tiki/images/je-tiki/spiral-packaging.jpeg', 'Амулет в упаковке', 1),
    ('pendant-spiral', 'https://circon3m22.github.io/je-tiki/images/je-tiki/spiral-packaging.jpeg', 'Подвеска Спираль в упаковке', 0),
    ('pendant-spiral', 'https://circon3m22.github.io/je-tiki/images/je-tiki/spiral-on-model.jpg', 'Подвеска Спираль на модели', 1),
    ('figurine-seven-dyuli', 'https://circon3m22.github.io/je-tiki/images/je-tiki/seven-guardians.jpg', 'Фигурка Дюли', 0),
    ('figurine-seven-dyuli', 'https://circon3m22.github.io/je-tiki/images/je-tiki/spiral-packaging.jpeg', 'Фигурка Дюли в упаковке', 1)
)
insert into public.product_images (product_id, external_url, alt_text, sort_order)
select p.id, s.external_url, s.alt_text, s.sort_order
from image_seed s
join public.products p on p.slug = s.slug
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and pi.external_url = s.external_url
);
