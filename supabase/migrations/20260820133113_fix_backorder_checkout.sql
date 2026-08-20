create or replace function public.create_order(
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
    left join public.products p on p.slug = ci.product_slug
    where ci.cart_id = v_cart_id
      and (
        p.id is null
        or not p.orderable
        or p.status <> 'published'
        or (p.stock_quantity > 0 and p.stock_quantity < ci.quantity)
      )
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
  where ci.cart_id = v_cart_id
    and ci.product_slug = p.slug
    and p.stock_quantity > 0;

  delete from public.cart_items where cart_id = v_cart_id;

  return query select v_order_id, v_order_number, v_subtotal + v_shipping;
end;
$$;
