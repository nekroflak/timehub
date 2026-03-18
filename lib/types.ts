export type PlatformRole = 'super_admin' | 'user'
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

// Resolved user context used across layouts
export interface UserContext {
  profile: Profile
  membership: OrgMember | null
  organization: Organization | null
  isSuperAdmin: boolean
  orgRole: OrgRole | null
}
