-- Performance indexes for existing query patterns
-- Only indexes that are actually used by current queries

-- time_entries: filtered by (organization_id, date) on admin reports and worker time page
CREATE INDEX IF NOT EXISTS idx_time_entries_org_date
  ON time_entries (organization_id, date);

-- time_entries: filtered by (user_id, date) on worker time page and stats
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date
  ON time_entries (user_id, date);

-- timesheet_submissions: filtered by (organization_id, year, month, status) on approvals + alerts
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_org_year_month_status
  ON timesheet_submissions (organization_id, year, month, status);

-- leave_requests: filtered by (organization_id, status) on admin requests + alerts
CREATE INDEX IF NOT EXISTS idx_leave_requests_org_status
  ON leave_requests (organization_id, status);

-- leave_requests: filtered by (user_id, status, reviewed_at) on worker alerts
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status
  ON leave_requests (user_id, status, reviewed_at);

-- tasks: filtered by (organization_id, status) on board + alerts
CREATE INDEX IF NOT EXISTS idx_tasks_org_status
  ON tasks (organization_id, status);

-- tasks: filtered by assigned_to for worker board and alerts
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
  ON tasks (assigned_to);

-- tasks: filtered by (organization_id, department_id) for department scoping
CREATE INDEX IF NOT EXISTS idx_tasks_org_department
  ON tasks (organization_id, department_id);

-- task_comments: filtered by task_id (used for comment counts per task)
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id
  ON task_comments (task_id);

-- organization_members: filtered by user_id (used in every layout and context lookup)
CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON organization_members (user_id);

-- organization_members: filtered by organization_id (used in team listing)
CREATE INDEX IF NOT EXISTS idx_org_members_org_id
  ON organization_members (organization_id);

-- invitations: filtered by (organization_id, status) on alerts + team page
CREATE INDEX IF NOT EXISTS idx_invitations_org_status
  ON invitations (organization_id, status);
