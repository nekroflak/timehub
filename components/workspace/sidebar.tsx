'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Clock,
  FileText,
  LogOut,
  Briefcase,
} from 'lucide-react'

interface WorkspaceSidebarProps {
  user: {
    name: string
    email: string
  }
  organization: {
    name: string
  }
}

const navigation = [
  { name: 'Dashboard', href: '/workspace', icon: LayoutDashboard },
  { name: 'Time Tracking', href: '/workspace/time', icon: Clock },
  { name: 'Notes', href: '/workspace/notes', icon: FileText },
]

export function WorkspaceSidebar({ user, organization }: WorkspaceSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Briefcase className="h-6 w-6 text-primary" />
        <div className="flex flex-col">
          <span className="font-semibold text-sm truncate">{organization.name}</span>
          <span className="text-xs text-muted-foreground">Workspace</span>
        </div>
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
