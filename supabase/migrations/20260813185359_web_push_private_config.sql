create table private.web_push_config (
  singleton boolean primary key default true check (singleton),
  public_key text not null,
  private_key text not null,
  subject text not null,
  updated_at timestamptz not null default now()
);

revoke all on private.web_push_config from public, anon, authenticated;
grant select, insert, update on private.web_push_config to service_role;

create function public.get_web_push_config()
returns table (public_key text, private_key text, subject text)
language sql
stable
security definer
set search_path = ''
as $$
  select config.public_key, config.private_key, config.subject
  from private.web_push_config as config
  where config.singleton = true;
$$;

revoke all on function public.get_web_push_config() from public, anon, authenticated;
grant execute on function public.get_web_push_config() to service_role;
