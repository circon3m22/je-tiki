alter table public.products alter column orderable set default true;

update public.products
set orderable = true
where status = 'published';

