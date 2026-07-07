-- Block authenticated users from tampering with quota / subscription columns.
-- Server-side quota updates use the service role (bypasses this trigger).

create or replace function public.protect_profile_quota_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if new.is_premium is distinct from old.is_premium
     or new.daily_message_count is distinct from old.daily_message_count
     or new.daily_message_reset_at is distinct from old.daily_message_reset_at
     or new.subscription_status is distinct from old.subscription_status
     or new.payment_provider is distinct from old.payment_provider
     or new.premium_started_at is distinct from old.premium_started_at then
    raise exception 'Cannot modify subscription or usage fields directly';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_quota_columns_trigger on public.profiles;
create trigger protect_profile_quota_columns_trigger
  before update on public.profiles
  for each row
  execute function public.protect_profile_quota_columns();
