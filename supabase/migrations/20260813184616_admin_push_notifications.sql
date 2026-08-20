create table public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_push_subscriptions_admin_user_id_idx
  on public.admin_push_subscriptions (admin_user_id);

create trigger set_admin_push_subscriptions_updated_at
before update on public.admin_push_subscriptions
for each row execute function private.set_updated_at();

alter table public.admin_push_subscriptions enable row level security;

create policy "admin_push_subscriptions_select_own"
on public.admin_push_subscriptions for select
to authenticated
using (
  admin_user_id = (select auth.uid())
  and (select private.is_admin())
);

create policy "admin_push_subscriptions_insert_own"
on public.admin_push_subscriptions for insert
to authenticated
with check (
  admin_user_id = (select auth.uid())
  and (select private.is_admin())
);

create policy "admin_push_subscriptions_update_own"
on public.admin_push_subscriptions for update
to authenticated
using (
  admin_user_id = (select auth.uid())
  and (select private.is_admin())
)
with check (
  admin_user_id = (select auth.uid())
  and (select private.is_admin())
);

create policy "admin_push_subscriptions_delete_own"
on public.admin_push_subscriptions for delete
to authenticated
using (
  admin_user_id = (select auth.uid())
  and (select private.is_admin())
);

revoke all on public.admin_push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.admin_push_subscriptions to authenticated;
grant all on public.admin_push_subscriptions to service_role;
