create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.product_status as enum ('draft', 'published', 'archived');
create type public.order_status as enum (
  'new', 'awaiting_payment', 'paid', 'forming', 'pickup_point_contact',
  'ready_to_ship', 'shipped', 'completed', 'cancelled', 'refunded'
);
create type public.payment_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');

create sequence public.order_number_seq start with 1;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  subtitle text not null default '',
  description text not null default '',
  price integer not null check (price >= 0),
  old_price integer check (old_price is null or old_price >= price),
  orderable boolean not null default false,
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  category_id uuid references public.categories(id) on delete set null,
  material text,
  wood_type text,
  metal text,
  metal_fineness text,
  metal_weight numeric(10, 3),
  dimensions text,
  weight numeric(10, 3),
  care text,
  uin text,
  giis_data jsonb not null default '{}'::jsonb,
  certificate_url text,
  declaration_url text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text,
  external_url text,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (num_nonnulls(storage_path, external_url) = 1),
  unique (product_id, sort_order)
);

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_slug text not null references public.products(slug) on update cascade on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cart_id, product_slug)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default (
    'JT-' || to_char(now(), 'YY') || lpad(nextval('public.order_number_seq')::text, 6, '0')
  ),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  subtotal integer not null check (subtotal >= 0),
  shipping_method text not null check (shipping_method in ('cdek', 'post')),
  shipping_cost integer not null check (shipping_cost >= 0),
  total integer not null check (total = subtotal + shipping_cost),
  shipping_city text not null,
  shipping_address text not null,
  pickup_point text,
  tracking_number text,
  tracking_url text,
  shipping_status text,
  payment_status public.payment_status not null default 'pending',
  status public.order_status not null default 'new',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  product_subtitle text not null default '',
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total = unit_price * quantity),
  created_at timestamptz not null default now()
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.site_content (
  key text primary key,
  content jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.legal_documents (
  slug text primary key check (slug in ('offer', 'privacy', 'personal-data', 'returns')),
  title text not null,
  body text not null default '',
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index products_category_idx on public.products(category_id);
create index products_status_featured_idx on public.products(status, featured);
create index product_images_product_idx on public.product_images(product_id, sort_order);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index order_items_order_idx on public.order_items(order_id);
create index payment_events_order_idx on public.payment_events(order_id);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at before update on public.categories
for each row execute function private.set_updated_at();
create trigger collections_set_updated_at before update on public.collections
for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
create trigger carts_set_updated_at before update on public.carts
for each row execute function private.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items
for each row execute function private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function private.set_updated_at();
create trigger site_content_set_updated_at before update on public.site_content
for each row execute function private.set_updated_at();
create trigger legal_documents_set_updated_at before update on public.legal_documents
for each row execute function private.set_updated_at();

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create function public.create_order(
  p_user_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_city text,
  p_shipping_address text,
  p_shipping_method text,
  p_comment text default null
)
returns table (order_id uuid, order_number text, total integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cart_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer;
  v_shipping integer;
begin
  if p_user_id is null then
    raise exception 'missing_user';
  end if;
  if p_shipping_method not in ('cdek', 'post') then
    raise exception 'invalid_shipping_method';
  end if;

  select id into v_cart_id
  from public.carts
  where user_id = p_user_id;

  if v_cart_id is null or not exists (
    select 1 from public.cart_items where cart_id = v_cart_id
  ) then
    raise exception 'empty_cart';
  end if;

  perform p.id
  from public.products p
  join public.cart_items ci on ci.product_slug = p.slug
  where ci.cart_id = v_cart_id
  order by p.id
  for update of p;

  if exists (
    select 1
    from public.cart_items ci
    join public.products p on p.slug = ci.product_slug
    where ci.cart_id = v_cart_id
      and (not p.orderable or p.status <> 'published' or p.stock_quantity < ci.quantity)
  ) then
    raise exception 'stock_changed';
  end if;

  select sum(p.price * ci.quantity)::integer into v_subtotal
  from public.cart_items ci
  join public.products p on p.slug = ci.product_slug
  where ci.cart_id = v_cart_id;

  v_shipping := case when v_subtotal >= 5000 then 0 else 500 end;

  insert into public.orders (
    user_id, customer_name, customer_phone, customer_email,
    subtotal, shipping_method, shipping_cost, total,
    shipping_city, shipping_address, comment, status
  ) values (
    p_user_id, left(trim(p_customer_name), 120), left(trim(p_customer_phone), 40),
    left(trim(lower(p_customer_email)), 254), v_subtotal, p_shipping_method,
    v_shipping, v_subtotal + v_shipping, left(trim(p_shipping_city), 160),
    left(trim(p_shipping_address), 500), nullif(left(trim(p_comment), 1000), ''),
    'awaiting_payment'
  )
  returning id, orders.order_number into v_order_id, v_order_number;

  insert into public.order_items (
    order_id, product_id, product_slug, product_name, product_subtitle,
    unit_price, quantity, line_total
  )
  select v_order_id, p.id, p.slug, p.name, p.subtitle,
    p.price, ci.quantity, p.price * ci.quantity
  from public.cart_items ci
  join public.products p on p.slug = ci.product_slug
  where ci.cart_id = v_cart_id;

  update public.products p
  set stock_quantity = p.stock_quantity - ci.quantity
  from public.cart_items ci
  where ci.cart_id = v_cart_id and ci.product_slug = p.slug;

  delete from public.cart_items where cart_id = v_cart_id;

  return query select v_order_id, v_order_number, v_subtotal + v_shipping;
end;
$$;

revoke all on function public.create_order(uuid, text, text, text, text, text, text, text)
from public, anon, authenticated;
grant execute on function public.create_order(uuid, text, text, text, text, text, text, text)
to service_role;

alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.collection_products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.legal_documents enable row level security;
alter table public.payment_events enable row level security;

create policy categories_public_read on public.categories for select
to anon, authenticated using (published);
create policy categories_admin_all on public.categories for all
to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy collections_public_read on public.collections for select
to anon, authenticated using (published);
create policy collections_admin_all on public.collections for all
to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy products_public_read on public.products for select
to anon, authenticated using (status = 'published');
create policy products_admin_all on public.products for all
to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy product_images_public_read on public.product_images for select
to anon, authenticated using (exists (
  select 1 from public.products p where p.id = product_id and p.status = 'published'
));
create policy product_images_admin_all on public.product_images for all
to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy collection_products_public_read on public.collection_products for select
to anon, authenticated using (exists (
  select 1 from public.collections c where c.id = collection_id and c.published
));
create policy collection_products_admin_all on public.collection_products for all
to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy carts_owner_select on public.carts for select to authenticated
using ((select auth.uid()) = user_id);
create policy carts_owner_insert on public.carts for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy carts_owner_update on public.carts for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy carts_owner_delete on public.carts for delete to authenticated
using ((select auth.uid()) = user_id);

create policy cart_items_owner_select on public.cart_items for select to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_owner_insert on public.cart_items for insert to authenticated
with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_owner_update on public.cart_items for update to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_owner_delete on public.cart_items for delete to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

create policy orders_owner_read on public.orders for select to authenticated
using ((select auth.uid()) = user_id);
create policy orders_admin_all on public.orders for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy order_items_owner_read on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy order_items_admin_all on public.order_items for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy admin_profiles_self_read on public.admin_profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy admin_profiles_admin_all on public.admin_profiles for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy site_content_public_read on public.site_content for select
to anon, authenticated using (published);
create policy site_content_admin_all on public.site_content for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy legal_documents_public_read on public.legal_documents for select
to anon, authenticated using (published);
create policy legal_documents_admin_all on public.legal_documents for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy payment_events_admin_all on public.payment_events for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories, public.collections, public.products,
  public.product_images, public.collection_products, public.site_content,
  public.legal_documents to anon;
grant select, insert, update, delete on public.carts, public.cart_items to authenticated;
grant select, insert, update, delete on public.categories, public.collections,
  public.products, public.product_images, public.collection_products,
  public.site_content, public.legal_documents to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.admin_profiles, public.payment_events to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_media_admin_read on storage.objects for select to authenticated
using (bucket_id = 'product-media' and (select private.is_admin()));
create policy product_media_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'product-media' and (select private.is_admin()));
create policy product_media_admin_update on storage.objects for update to authenticated
using (bucket_id = 'product-media' and (select private.is_admin()))
with check (bucket_id = 'product-media' and (select private.is_admin()));
create policy product_media_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'product-media' and (select private.is_admin()));

insert into public.categories (slug, name, sort_order) values
  ('earrings', 'Серьги', 10),
  ('pendants', 'Подвески', 20),
  ('brooches', 'Броши', 30),
  ('bracelets', 'Браслеты', 40),
  ('souvenirs', 'Сувениры', 50),
  ('business', 'Для бизнеса', 60);

insert into public.products (
  slug, name, subtitle, description, price, orderable, status, featured,
  stock_quantity, category_id, material, wood_type, metal, dimensions, care
)
select
  item.slug, item.name, item.subtitle, item.description, item.price,
  item.orderable, 'published'::public.product_status, item.featured,
  item.stock_quantity, category.id, item.material, item.wood_type,
  item.metal, item.dimensions, item.care
from (values
  ('earrings-spiral', 'Спирали', 'Серьги · японский вяз', 'Спираль — один из основных символов традиционного орнамента народов Приамурья.', 3600, true, true, 3, 'earrings', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('studs-triangle', 'Треугольник', 'Пуссеты · японский вяз', 'Равносторонний треугольник выражает единство макромира, микромира и человека.', 1800, true, true, 8, 'earrings', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Миниатюрный формат', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('studs-amur-rhythm', 'В ритме Амура', 'Пуссеты · японский вяз', 'Миниатюрные пуссеты в форме символов бытования и верований коренных народов Приамурья.', 1800, true, true, 6, 'earrings', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Миниатюрный формат', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('amulet-seven-guardians', 'Сэвэны-хранители', 'Амулет · японский вяз', 'Амулет объединяет антропоморфные и зооморфные образы хранителей.', 4200, true, true, 2, 'pendants', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Стальная фурнитура', 'Композиция из трёх фигур', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('pendant-spiral', 'Амурская спираль', 'Подвеска · японский вяз', 'Традиционная спираль становится лаконичным знаком в натуральном дереве.', 3400, true, true, 4, 'pendants', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('figurine-seven-dyuli', 'Сэвэн Дюли', 'Статуэтка · японский вяз', 'Дюли считался хранителем домашнего очага и покровителем семьи.', 5500, true, true, 1, 'souvenirs', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Без металла', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('earrings-amur-patterns', 'Амурские узоры', 'Серьги · дерево и керамика', 'Нанайский орнамент соединён с акцентной керамикой ручной работы.', 0, false, false, 0, 'earrings', 'Натуральное дерево, керамика ручной работы, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('studs-amur-patterns', 'Амурские узоры', 'Пуссеты · натуральное дерево', 'Нанайский орнамент и выразительная фактура дерева делают каждую пару неповторимой.', 0, false, false, 0, 'earrings', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('pendants-amur-patterns', 'Амурские узоры', 'Подвеска · дерево и керамика', 'Нанайский орнамент сочетается с акцентной керамикой ручной работы.', 0, false, false, 0, 'pendants', 'Натуральное дерево, керамика ручной работы, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('brooches-amur-rhythm', 'В ритме Амура', 'Броши · силуэты флоры и фауны', 'Броши в форме кота, енота, дубового листа, китового хвоста и лисы.', 0, false, false, 0, 'brooches', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('pendants-amur-endemics', 'В ритме Амура', 'Подвески · силуэты флоры и фауны', 'Подвески в форме природных силуэтов и традиционных знаков.', 0, false, false, 0, 'pendants', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('figurine-whale-tail', 'Китовый хвост', 'Статуэтка · натуральное дерево', 'Деревянная статуэтка в форме китового хвоста.', 0, false, false, 0, 'souvenirs', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Без металла', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('earrings-seven-guardians', 'Сэвэны-хранители', 'Серьги · японский вяз', 'Одинаковые или асимметричные пары фигурок хранителей.', 0, false, false, 0, 'earrings', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('pendant-seven-guardians', 'Сэвэны-хранители', 'Подвеска · японский вяз', 'Подвески Исэлэ, Птица счастья и Дюли.', 0, false, false, 0, 'pendants', 'Массив натурального дерева, стальная фурнитура', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-seven-guardians', 'Сэвэны-хранители', 'Браслет · японский вяз', 'Браслет с антропоморфной или зооморфной фигуркой хранителя.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Сталь', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('keychain-seven-guardians', 'Сэвэны-хранители', 'Объёмный брелок · японский вяз', 'Брелок в форме Дюли, Исэлэ или Птицы счастья.', 0, false, false, 0, 'souvenirs', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Сталь', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('mini-keychain-seven-guardians', 'Мини-сэвэн', 'Мини-брелок · японский вяз', 'Миниатюрная фигурка одного из хранителей.', 0, false, false, 0, 'souvenirs', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Сталь', '1 × 2 см', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('figurine-seven-dyuli-large', 'Сэвэн Дюли — большой', 'Статуэтка · японский вяз', 'Увеличенная статуэтка хранителя домашнего очага.', 0, false, false, 0, 'souvenirs', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Без металла', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('figurine-winged-ayami', 'Крылатый Аями', 'Статуэтка · японский вяз', 'Культовый образ в авторской интерпретации JE TIKI.', 0, false, false, 0, 'souvenirs', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Без металла', 'Размер уточняется', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('paired-bracelets-triangle', 'Треугольники', 'Парные браслеты · чёрное и светлое дерево', 'Парные браслеты со знаком равностороннего треугольника.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('paired-bracelets-circle', 'Круги', 'Парные браслеты · чёрное и светлое дерево', 'Парные браслеты со знаками круга — образами инь и янь.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-cross', 'Крест', 'Браслет · натуральное дерево', 'Браслет с древним знаком защиты и процветания.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-triangle', 'Треугольник', 'Браслет · натуральное дерево', 'Браслет со знаком единства духа, души и сознания.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-circle', 'Круг', 'Браслет · натуральное дерево', 'Браслет со знаком бесконечности и круговорота бытия.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-heart', 'Сердце', 'Браслет · натуральное дерево', 'Лаконичный браслет с тёплым знаком сердца.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-mountains', 'Горы', 'Браслет · натуральное дерево', 'Браслет с силуэтом гор Дальнего Востока.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-snowboard', 'Сноуборд', 'Браслет · натуральное дерево', 'Миниатюрный знак для тех, кто выбирает снег и движение.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('bracelet-surf', 'Сёрф', 'Браслет · натуральное дерево', 'Миниатюрный знак движения по воде и свободы.', 0, false, false, 0, 'bracelets', 'Массив натурального дерева', 'Порода уточняется', 'Без металла', 'Регулируемая затяжка', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('studs-circle', 'Круг', 'Пуссеты · натуральное дерево', 'Миниатюрные пуссеты в форме круга.', 0, false, false, 0, 'earrings', 'Массив натурального дерева, стальная фурнитура', 'Порода уточняется', 'Сталь', 'Миниатюрный формат', 'Берегите дерево от воды, парфюма и прямого солнца.'),
  ('corporate-bookmark', 'Закладка с гравировкой', 'Для мероприятий · от 350 ₽ при заказе от 50 шт.', 'Деревянная закладка с логотипом, надписью или традиционным орнаментом.', 350, false, false, 0, 'business', 'Массив дальневосточного вяза или ясеня', 'Вяз или ясень', 'Без металла', '18 × 3 см', 'Берегите дерево от воды и прямого солнца.'),
  ('corporate-keychain-guardian', 'Сэвэн-хранитель', 'Брелок для мероприятий · от 550 ₽ при заказе от 50 шт.', 'Объёмный брелок, дизайн которого можно адаптировать под символ мероприятия.', 550, false, false, 0, 'business', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Сталь', '8 × 2 см', 'Берегите дерево от воды и прямого солнца.'),
  ('corporate-mini-bracelet-keychain', 'Мини-браслет или брелок', 'Для мероприятий · от 280 ₽ при заказе от 50 шт.', 'Миниатюрное изделие с символикой региона, форума или другого мероприятия.', 280, false, false, 0, 'business', 'Массив натурального дерева', 'Японский вяз из Хабаровского края', 'Сталь', '1 × 2 см', 'Берегите дерево от воды и прямого солнца.')
) as item(
  slug, name, subtitle, description, price, orderable, featured,
  stock_quantity, category_slug, material, wood_type, metal, dimensions, care
)
join public.categories category on category.slug = item.category_slug;

insert into public.site_content (key, content) values
  ('hero', '{"eyebrow":"Приамурье · дерево · ручная работа","title":"В ритме Амура","cta":"Смотреть украшения"}'::jsonb),
  ('about', '{"title":"JE TIKI — современный предметный язык природы и культуры Приамурья."}'::jsonb),
  ('contacts', '{"phone":"+7 914 771-12-52","instagram":"@je_tiki"}'::jsonb);

insert into public.legal_documents (slug, title, body, published) values
  ('offer', 'Публичная оферта', '', false),
  ('privacy', 'Политика конфиденциальности', '', false),
  ('personal-data', 'Согласие на обработку персональных данных', '', false),
  ('returns', 'Возврат и обмен', '', false);
