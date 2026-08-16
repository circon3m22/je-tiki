-- Je Tiki commerce schema.
-- Monetary values are stored as whole Russian rubles. This matches the catalog
-- contract and avoids floating-point arithmetic in checkout code.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null default '',
  description text not null default '',
  category text not null check (
    category in ('earrings', 'pendants', 'bracelets', 'keychains', 'gifts')
  ),
  price integer not null check (price > 0),
  old_price integer check (old_price is null or old_price >= price),
  materials text[] not null default '{}'::text[],
  wood_type text,
  metal text,
  dimensions text not null default '',
  weight integer not null default 0 check (weight >= 0),
  fastening text,
  sku text not null unique check (char_length(btrim(sku)) between 1 and 80),
  stock integer not null default 0 check (stock >= 0),
  is_made_to_order boolean not null default false,
  production_time text not null default '',
  is_available boolean not null default false,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  wildberries_url text check (
    wildberries_url is null or wildberries_url ~ '^https://'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null check (char_length(btrim(image_url)) > 0),
  alt_text text not null check (char_length(btrim(alt_text)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  unique (product_id, sort_order)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    check (char_length(btrim(order_number)) between 6 and 40),
  checkout_idempotency_key uuid not null unique,
  customer_name text not null
    check (char_length(btrim(customer_name)) between 1 and 80),
  customer_surname text not null
    check (char_length(btrim(customer_surname)) between 1 and 80),
  customer_phone text not null
    check (char_length(btrim(customer_phone)) between 10 and 32),
  customer_email text not null
    check (char_length(btrim(customer_email)) between 3 and 254),
  city text not null check (char_length(btrim(city)) between 1 and 120),
  postal_code text check (
    postal_code is null or char_length(btrim(postal_code)) between 3 and 20
  ),
  address text check (
    address is null or char_length(btrim(address)) between 3 and 250
  ),
  apartment text check (
    apartment is null or char_length(btrim(apartment)) between 1 and 40
  ),
  delivery_method text not null check (
    delivery_method in (
      'pickup-khabarovsk',
      'cdek-pickup',
      'cdek-courier',
      'russian-post'
    )
  ),
  delivery_price integer not null check (delivery_price >= 0),
  subtotal integer not null check (subtotal > 0),
  total integer not null check (total > 0 and total = subtotal + delivery_price),
  payment_status text not null default 'pending_payment' check (
    payment_status in (
      'pending_payment',
      'paid',
      'canceled',
      'refunded',
      'payment_failed'
    )
  ),
  order_status text not null default 'new' check (
    order_status in (
      'new',
      'confirmed',
      'processing',
      'shipped',
      'completed',
      'canceled'
    )
  ),
  payment_provider text not null default 'yookassa'
    check (payment_provider = 'yookassa'),
  external_payment_id text unique,
  customer_comment text check (
    customer_comment is null or char_length(customer_comment) <= 1000
  ),
  privacy_accepted_at timestamptz not null default now(),
  notifications_sent_at timestamptz,
  inventory_released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null
    check (char_length(btrim(product_name)) between 1 and 160),
  product_sku text not null
    check (char_length(btrim(product_sku)) between 1 and 80),
  unit_price integer not null check (unit_price > 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total integer not null check (
    line_total > 0 and line_total = unit_price * quantity
  )
);

create index products_public_catalog_idx
  on public.products (category, created_at desc)
  where is_available;

create index products_featured_idx
  on public.products (is_featured, created_at desc)
  where is_available;

create index product_images_product_sort_idx
  on public.product_images (product_id, sort_order);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_payment_status_idx
  on public.orders (payment_status, created_at desc);
create index orders_order_status_idx
  on public.orders (order_status, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create or replace function private.set_updated_at()
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

revoke all on function private.set_updated_at() from public;
revoke all on function private.set_updated_at() from anon, authenticated;

create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function private.set_updated_at();

-- Atomically validates current catalog data, snapshots order lines, and reserves
-- stock. The function remains SECURITY INVOKER and is executable only by the
-- server-side service_role/secret key.
create or replace function public.create_checkout_order(p_payload jsonb)
returns table (
  order_id uuid,
  order_number text,
  subtotal integer,
  delivery_price integer,
  total integer,
  external_payment_id text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_checkout_idempotency_key uuid;
  v_delivery_base_price integer;
  v_free_delivery_from integer;
  v_delivery_price integer;
  v_subtotal integer;
  v_requested_count integer;
  v_valid_count integer;
begin
  if p_payload is null
    or jsonb_typeof(p_payload) is distinct from 'object'
    or jsonb_typeof(p_payload -> 'items') is distinct from 'array'
    or coalesce(jsonb_array_length(p_payload -> 'items'), 0) not between 1 and 50
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_checkout_payload';
  end if;

  v_checkout_idempotency_key :=
    (p_payload ->> 'checkout_idempotency_key')::uuid;
  v_order_number := btrim(p_payload ->> 'order_number');
  v_delivery_base_price := (p_payload ->> 'delivery_base_price')::integer;
  v_free_delivery_from := (p_payload ->> 'free_delivery_from')::integer;

  if v_delivery_base_price < 0 or v_free_delivery_from < 0 then
    raise exception using
      errcode = '22023',
      message = 'invalid_delivery_price';
  end if;

  -- A completed earlier request with the same key is returned unchanged.
  return query
  select
    existing.id,
    existing.order_number,
    existing.subtotal,
    existing.delivery_price,
    existing.total,
    existing.external_payment_id
  from public.orders as existing
  where existing.checkout_idempotency_key = v_checkout_idempotency_key;

  if found then
    return;
  end if;

  select
    count(*),
    count(distinct item.product_id)
  into v_requested_count, v_valid_count
  from jsonb_to_recordset(p_payload -> 'items')
    as item(product_id uuid, quantity integer)
  where item.quantity between 1 and 99;

  if v_requested_count <> jsonb_array_length(p_payload -> 'items')
    or v_valid_count <> v_requested_count
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_checkout_items';
  end if;

  -- Lock in a stable order so concurrent checkouts cannot oversell stock.
  perform product.id
  from public.products as product
  join jsonb_to_recordset(p_payload -> 'items')
    as item(product_id uuid, quantity integer)
    on item.product_id = product.id
  order by product.id
  for update of product;

  select count(*)
  into v_valid_count
  from public.products as product
  join jsonb_to_recordset(p_payload -> 'items')
    as item(product_id uuid, quantity integer)
    on item.product_id = product.id
  where product.is_available
    and (product.is_made_to_order or product.stock >= item.quantity);

  if v_valid_count <> v_requested_count then
    raise exception using
      errcode = 'P0001',
      message = 'cart_contains_unavailable_products';
  end if;

  select coalesce(sum(product.price * item.quantity), 0)::integer
  into v_subtotal
  from public.products as product
  join jsonb_to_recordset(p_payload -> 'items')
    as item(product_id uuid, quantity integer)
    on item.product_id = product.id;

  v_delivery_price := case
    when p_payload ->> 'delivery_method' = 'pickup-khabarovsk' then 0
    when v_subtotal >= v_free_delivery_from then 0
    else v_delivery_base_price
  end;

  insert into public.orders (
    order_number,
    checkout_idempotency_key,
    customer_name,
    customer_surname,
    customer_phone,
    customer_email,
    city,
    postal_code,
    address,
    apartment,
    delivery_method,
    delivery_price,
    subtotal,
    total,
    payment_status,
    order_status,
    payment_provider,
    customer_comment
  )
  values (
    v_order_number,
    v_checkout_idempotency_key,
    btrim(p_payload ->> 'customer_name'),
    btrim(p_payload ->> 'customer_surname'),
    btrim(p_payload ->> 'customer_phone'),
    lower(btrim(p_payload ->> 'customer_email')),
    btrim(p_payload ->> 'city'),
    nullif(btrim(p_payload ->> 'postal_code'), ''),
    nullif(btrim(p_payload ->> 'address'), ''),
    nullif(btrim(p_payload ->> 'apartment'), ''),
    p_payload ->> 'delivery_method',
    v_delivery_price,
    v_subtotal,
    v_subtotal + v_delivery_price,
    'pending_payment',
    'new',
    'yookassa',
    nullif(btrim(p_payload ->> 'customer_comment'), '')
  )
  on conflict (checkout_idempotency_key) do nothing
  returning id into v_order_id;

  -- A concurrent request with a disjoint cart may win the idempotency race.
  if v_order_id is null then
    return query
    select
      existing.id,
      existing.order_number,
      existing.subtotal,
      existing.delivery_price,
      existing.total,
      existing.external_payment_id
    from public.orders as existing
    where existing.checkout_idempotency_key = v_checkout_idempotency_key;
    return;
  end if;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    product_sku,
    unit_price,
    quantity,
    line_total
  )
  select
    v_order_id,
    product.id,
    product.name,
    product.sku,
    product.price,
    item.quantity,
    product.price * item.quantity
  from public.products as product
  join jsonb_to_recordset(p_payload -> 'items')
    as item(product_id uuid, quantity integer)
    on item.product_id = product.id;

  update public.products as product
  set
    stock = case
      when product.is_made_to_order then product.stock
      else product.stock - item.quantity
    end,
    is_available = case
      when product.is_made_to_order then product.is_available
      else product.is_available and product.stock - item.quantity > 0
    end
  from jsonb_to_recordset(p_payload -> 'items')
    as item(product_id uuid, quantity integer)
  where product.id = item.product_id;

  return query
  select
    created.id,
    created.order_number,
    created.subtotal,
    created.delivery_price,
    created.total,
    created.external_payment_id
  from public.orders as created
  where created.id = v_order_id;
end;
$$;

-- Releases a pending reservation exactly once after YooKassa has confirmed that
-- the payment is canceled. Made-to-order products do not use finite stock.
create or replace function public.cancel_checkout_order(
  p_order_id uuid,
  p_payment_id text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_canceled boolean;
begin
  update public.orders as canceled_order
  set
    external_payment_id = coalesce(canceled_order.external_payment_id, p_payment_id),
    payment_status = 'canceled',
    order_status = 'canceled',
    inventory_released_at = now()
  where canceled_order.id = p_order_id
    and canceled_order.payment_status = 'pending_payment'
    and canceled_order.inventory_released_at is null
    and (
      canceled_order.external_payment_id is null
      or canceled_order.external_payment_id = p_payment_id
    )
  returning true into v_canceled;

  if not coalesce(v_canceled, false) then
    return false;
  end if;

  update public.products as product
  set
    stock = product.stock + reserved.quantity,
    is_available = product.is_available or product.stock = 0
  from (
    select
      item.product_id,
      sum(item.quantity)::integer as quantity
    from public.order_items as item
    where item.order_id = p_order_id
      and item.product_id is not null
    group by item.product_id
  ) as reserved
  where product.id = reserved.product_id
    and not product.is_made_to_order;

  return true;
end;
$$;

-- RLS is enabled on every table in the exposed public schema. Catalog reads
-- are public only for available products. Orders and their line items have no
-- public policies and can only be accessed by the trusted server client.
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "available products are publicly readable"
on public.products
for select
to anon, authenticated
using (is_available);

create policy "images of available products are publicly readable"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products as product
    where product.id = product_images.product_id
      and product.is_available
  )
);

-- Explicit grants are required for new Supabase projects where public-schema
-- tables are no longer automatically exposed to the Data API.
revoke all on table public.products from public, anon, authenticated;
revoke all on table public.product_images from public, anon, authenticated;
revoke all on table public.orders from public, anon, authenticated;
revoke all on table public.order_items from public, anon, authenticated;

grant select on table public.products to anon, authenticated;
grant select on table public.product_images to anon, authenticated;

grant select, insert, update, delete
on table public.products, public.product_images, public.orders, public.order_items
to service_role;

revoke all on function public.create_checkout_order(jsonb) from public;
revoke all on function public.create_checkout_order(jsonb) from anon, authenticated;
grant execute on function public.create_checkout_order(jsonb) to service_role;

revoke all on function public.cancel_checkout_order(uuid, text) from public;
revoke all on function public.cancel_checkout_order(uuid, text)
from anon, authenticated;
grant execute on function public.cancel_checkout_order(uuid, text)
to service_role;
