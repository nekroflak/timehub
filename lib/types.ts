export type UserRole = 'super_admin' | 'admin' | 'worker'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_super_admin: boolean
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  user_id: string
  organization_id: string
  role: 'admin' | 'worker'
  created_at: string
  updated_at: string
  organization?: Organization
  profile?: Profile
}

export interface Invitation {
  id: string
  email: string
  organization_id: string | null
  role: UserRole
  token: string
  expires_at: string
  accepted_at: string | null
  invited_by: string
  created_at: string
  organization?: Organization
}

export interface TimeEntry {
  id: string
  user_id: string
  organization_id: string
  date: string
  hours: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface UserContext {
  user: Profile
  memberships: Membership[]
  currentOrganization: Organization | null
  role: UserRole | null
}
