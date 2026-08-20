create index cart_items_product_slug_idx
on public.cart_items (product_slug);

create index collection_products_product_id_idx
on public.collection_products (product_id);

create index order_items_product_id_idx
on public.order_items (product_id);
