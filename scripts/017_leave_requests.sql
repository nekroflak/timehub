-- 017_leave_requests.sql
-- Adds the leave_requests table for the Wnioski / Nieobecności module.
-- Does NOT modify any existing tables.

create table if not exists leave_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  type             text not null check (type in ('vacation', 'home_office', 'private_leave', 'sick_leave')),
  date_from        date not null,
  date_to          date not null,
  worker_note      text,
  admin_comment    text,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by      uuid references auth.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint date_order check (date_to >= date_from)
);

-- Indexes
create index if not exists leave_requests_org_idx    on leave_requests (organization_id);
create index if not exists leave_requests_user_idx   on leave_requests (user_id);
create index if not exists leave_requests_status_idx on leave_requests (status);
create index if not exists leave_requests_dates_idx  on leave_requests (date_from, date_to);

-- RLS
alter table leave_requests enable row level security;

-- Workers: read own requests only
create policy "workers_read_own_leave_requests"
  on leave_requests for select
  using (auth.uid() = user_id);

-- Workers: insert own requests only
create policy "workers_insert_own_leave_requests"
  on leave_requests for insert
  with check (auth.uid() = user_id);

-- Workers: delete own pending requests
create policy "workers_delete_own_pending_leave_requests"
  on leave_requests for delete
  using (auth.uid() = user_id and status = 'pending');

-- Admins: read all requests in their organization
create policy "admins_read_org_leave_requests"
  on leave_requests for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.user_id = auth.uid()
        and organization_members.organization_id = leave_requests.organization_id
        and organization_members.role = 'admin'
    )
  );

-- Admins: update (approve/reject) requests in their org
create policy "admins_update_org_leave_requests"
  on leave_requests for update
  using (
    exists (
      select 1 from organization_members
      where organization_members.user_id = auth.uid()
        and organization_members.organization_id = leave_requests.organization_id
        and organization_members.role = 'admin'
    )
  );
