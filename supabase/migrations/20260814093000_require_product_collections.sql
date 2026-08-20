alter table public.collections
  add column if not exists hero_image_url text,
  add column if not exists sort_order integer not null default 0;

update public.collections
set
  sort_order = case slug
    when 'amur-rhythm' then 10
    when 'seven-guardians' then 20
    when 'on-the-way' then 30
    else sort_order
  end,
  hero_image_url = case slug
    when 'amur-rhythm' then 'https://circon3m22.github.io/je-tiki/images/je-tiki/spiral-on-model.jpg'
    when 'seven-guardians' then 'https://circon3m22.github.io/je-tiki/images/je-tiki/seven-guardians.jpg'
    when 'on-the-way' then 'https://circon3m22.github.io/je-tiki/images/je-tiki/triangle-on-model.webp'
    else hero_image_url
  end;

alter table public.products
  add column if not exists collection_id uuid;

update public.products as product
set collection_id = collection.id
from public.collections as collection
where collection.slug = case
  when product.slug = any (array[
    'studs-amur-rhythm', 'earrings-spiral', 'pendant-spiral',
    'earrings-amur-patterns', 'studs-amur-patterns', 'pendants-amur-patterns',
    'brooches-amur-rhythm', 'pendants-amur-endemics', 'figurine-whale-tail'
  ]) then 'amur-rhythm'
  when product.slug = any (array[
    'amulet-seven-guardians', 'figurine-seven-dyuli', 'corporate-keychain-guardian',
    'earrings-seven-guardians', 'pendant-seven-guardians', 'bracelet-seven-guardians',
    'keychain-seven-guardians', 'mini-keychain-seven-guardians',
    'figurine-seven-dyuli-large', 'figurine-winged-ayami'
  ]) then 'seven-guardians'
  else 'on-the-way'
end;

do $$
begin
  if exists (select 1 from public.products where collection_id is null) then
    raise exception 'Every product must belong to a collection';
  end if;
end
$$;

alter table public.products
  alter column collection_id set not null;

alter table public.products
  drop constraint if exists products_collection_id_fkey;

alter table public.products
  add constraint products_collection_id_fkey
  foreign key (collection_id) references public.collections(id) on delete restrict;

create index if not exists products_collection_id_idx
  on public.products (collection_id);

delete from public.collection_products;

insert into public.collection_products (collection_id, product_id, sort_order)
select
  product.collection_id,
  product.id,
  row_number() over (partition by product.collection_id order by product.name, product.id) - 1
from public.products as product;

create unique index if not exists collection_products_product_id_idx
  on public.collection_products (product_id);

create or replace function public.sync_product_collection_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.collection_products where product_id = new.id;
  insert into public.collection_products (collection_id, product_id, sort_order)
  values (
    new.collection_id,
    new.id,
    coalesce((select max(sort_order) + 1 from public.collection_products where collection_id = new.collection_id), 0)
  );
  return new;
end;
$$;

drop trigger if exists sync_product_collection_link on public.products;
create trigger sync_product_collection_link
after insert or update of collection_id on public.products
for each row execute function public.sync_product_collection_link();

