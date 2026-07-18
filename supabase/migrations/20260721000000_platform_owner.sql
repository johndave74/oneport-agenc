-- =====================================================================
-- OnePort Agency — Platform Owner / Platform Staff security model
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- Two platform roles only: PLATFORM_OWNER (unique root account) and
-- PLATFORM_STAFF. The Owner is protected by a database trigger so the rules
-- hold even if the UI or an API is bypassed. Ownership moves only through the
-- transfer function, which guarantees exactly one owner at all times.
-- =====================================================================

-- 1. Collapse the old multi-role platform set into Owner + Staff.
update public.users set "platformRole" = 'PLATFORM_OWNER', "isPlatformAdmin" = true
where "platformRole" = 'PLATFORM_SUPER_ADMIN';

-- If somehow no owner exists yet, promote the earliest platform admin.
update public.users set "platformRole" = 'PLATFORM_OWNER', "isPlatformAdmin" = true
where id = (select id from public.users where "isPlatformAdmin" = true order by email limit 1)
  and not exists (select 1 from public.users where "platformRole" = 'PLATFORM_OWNER');

update public.users set "platformRole" = 'PLATFORM_STAFF', "isPlatformAdmin" = false
where "platformRole" is not null and "platformRole" <> 'PLATFORM_OWNER';

-- 2. At most one Platform Owner, enforced by the database.
create unique index if not exists one_platform_owner
  on public.users ("platformRole") where "platformRole" = 'PLATFORM_OWNER';

-- 3. Protect the Owner: cannot be demoted, suspended, deactivated, or deleted
--    except through the transfer function (which sets the bypass flag).
create or replace function public.protect_platform_owner()
returns trigger language plpgsql security definer set search_path = public as $$
declare bypass boolean := coalesce(current_setting('app.allow_owner_change', true) = '1', false);
begin
  if tg_op = 'DELETE' then
    if old."platformRole" = 'PLATFORM_OWNER' and not bypass then
      raise exception 'Platform Owner cannot be deleted. Transfer ownership first.';
    end if;
    return old;
  end if;

  if old."platformRole" = 'PLATFORM_OWNER' and not bypass then
    if new."platformRole" is distinct from 'PLATFORM_OWNER' then
      raise exception 'Platform Owner role cannot be changed. Transfer ownership first.';
    end if;
    if coalesce(new."accountStatus", 'active') <> 'active' then
      raise exception 'Platform Owner cannot be suspended or deactivated.';
    end if;
    if new."isPlatformAdmin" is distinct from true then
      raise exception 'Platform Owner cannot be demoted.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_owner_trg on public.users;
create trigger protect_owner_trg before update or delete on public.users
  for each row execute function public.protect_platform_owner();

-- 4. Atomic ownership transfer: demote current owner, promote a staff member.
--    Never zero or multiple owners. Only callable by the service role (the
--    admin Edge Function verifies the caller is the current Owner first).
create or replace function public.transfer_platform_ownership(new_owner uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_owner uuid;
begin
  select id into current_owner from public.users where "platformRole" = 'PLATFORM_OWNER';
  if current_owner is null then raise exception 'There is no current Platform Owner.'; end if;
  if new_owner = current_owner then raise exception 'Choose a different user to transfer ownership to.'; end if;
  if (select "platformRole" from public.users where id = new_owner) is distinct from 'PLATFORM_STAFF' then
    raise exception 'Ownership can only be transferred to a Platform Staff member.';
  end if;

  perform set_config('app.allow_owner_change', '1', true);
  update public.users set "platformRole" = 'PLATFORM_STAFF', "isPlatformAdmin" = false where id = current_owner;
  update public.users set "platformRole" = 'PLATFORM_OWNER',  "isPlatformAdmin" = true  where id = new_owner;
  perform set_config('app.allow_owner_change', '0', true);
end $$;

revoke all on function public.transfer_platform_ownership(uuid) from public, anon, authenticated;
