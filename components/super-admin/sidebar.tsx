'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Building2,
  LayoutDashboard,
  Mail,
  LogOut,
  Shield,
} from 'lucide-react'

interface SuperAdminSidebarProps {
  user: {
    name: string
    email: string
  }
}

const navigation = [
  { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
  { name: 'Organizations', href: '/super-admin/organizations', icon: Building2 },
  { name: 'Invitations', href: '/super-admin/invitations', icon: Mail },
]

export function SuperAdminSidebar({ user }: SuperAdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-semibold">Super Admin</span>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start gap-2" type="submit">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}
