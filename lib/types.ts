export type PlatformRole = 'super_admin' | 'user'
export type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type OrgRole = 'admin' | 'worker'
export type OrgStatus = 'active' | 'trial' | 'blocked'
export type OrgPlan = 'free' | 'pro' | 'enterprise'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
export type TimeEntryType = 'work' | 'vacation'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  platform_role: PlatformRole
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string | null
  status: OrgStatus
  plan: OrgPlan
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  organization_id: string
  user_id: string
  role: OrgRole
  department_id: string | null
  created_at: string
  organization?: Organization
  profile?: Profile
}

export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: OrgRole
  invited_by: string | null
  token: string
  status: InvitationStatus
  expires_at: string | null
  accepted_at: string | null
  created_at: string
  organization?: Organization
}

export interface Department {
  id: string
  organization_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  organization_id: string
  user_id: string
  date: string
  start_time: string | null
  end_time: string | null
  hours: number | null
  type: TimeEntryType
  description: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  organization_id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface UserConfig {
  id: string
  organization_id: string
  user_id: string
  hours_per_day: number
  hourly_rate: number
  overtime_multiplier: number
  currency: string
}

export interface TimesheetSubmission {
  id: string
  organization_id: string
  user_id: string
  year: number
  month: number
  status: SubmissionStatus
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  comment: string | null
  created_at: string
  updated_at: string
  profile?: Pick<Profile, 'full_name' | 'email'>
}

// Tasks module
export type TaskStatus = 'todo' | 'assigned' | 'done'

export interface Task {
  id: string
  organization_id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_to: string | null
  created_by: string
  assigned_at: string | null
  department_id: string | null
  created_at: string
  updated_at: string
  // joined
  assignee?: Pick<Profile, 'id' | 'full_name' | 'email'> | null
  creator?: Pick<Profile, 'id' | 'full_name' | 'email'> | null
  comments_count?: number
  department?: Pick<Department, 'id' | 'name'> | null
}

export interface TaskComment {
  id: string
  task_id: string
  organization_id: string
  user_id: string
  content: string
  created_at: string
  author?: Pick<Profile, 'id' | 'full_name' | 'email'> | null
}

// Resolved user context used across layouts
export interface UserContext {
  profile: Profile
  membership: OrgMember | null
  organization: Organization | null
  isSuperAdmin: boolean
  orgRole: OrgRole | null
}
