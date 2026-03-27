-- team_availability_blocks
-- Stores anonymized busy/absence blocks for the team availability view.
-- IMPORTANT: No event titles, descriptions, links or private data stored here.

create table if not exists team_availability_blocks (
  id               uuid        primary key default gen_random_uuid(),
  organization_id  uuid        not null references organizations(id) on delete cascade,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  source           text        not null check (source in ('google', 'outlook', 'leave_request')),
  status           text        not null check (status in ('busy', 'absence')),
  date             date        not null,
  start_time       time        not null,
  end_time         time        not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Covering index for the team availability read query
create index if not exists idx_team_availability_blocks_lookup
  on team_availability_blocks (organization_id, user_id, date);

-- Index for per-user per-source cleanup during sync
create index if not exists idx_team_availability_blocks_sync
  on team_availability_blocks (user_id, source, date);

-- RLS
alter table team_availability_blocks enable row level security;

-- Workers and admins in the same org can SELECT
create policy "org members can view availability blocks"
  on team_availability_blocks
  for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.user_id = auth.uid()
        and organization_members.organization_id = team_availability_blocks.organization_id
    )
  );

-- Users can only insert/update/delete their own blocks
create policy "users can manage own availability blocks"
  on team_availability_blocks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
