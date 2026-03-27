'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Clock,
  LogOut,
  Building2,
  CheckSquare,
  Layers,
  KanbanSquare,
  FileCheck,
  Users2,
} from 'lucide-react'

interface AdminSidebarProps {
  user: {
    name: string
    email: string
  }
  organization: {
    name: string
    slug: string
  }
}

const navigation = [
  { name: 'Pulpit', href: '/admin', icon: LayoutDashboard },
  { name: 'Zespół', href: '/admin/team', icon: Users },
  { name: 'Działy', href: '/admin/departments', icon: Layers },
  { name: 'Tablica zadań', href: '/admin/board', icon: KanbanSquare },
  { name: 'Wnioski', href: '/admin/requests', icon: FileCheck },
  { name: 'Dostępność', href: '/admin/availability', icon: Users2 },
  { name: 'Raporty czasu', href: '/admin/time-reports', icon: Clock },
  { name: 'Zatwierdzenia', href: '/admin/approvals', icon: CheckSquare },
]

export function AdminSidebar({ user, organization }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Building2 className="h-6 w-6 text-primary" />
        <div className="flex flex-col">
          <span className="font-semibold text-sm truncate">{organization.name}</span>
          <span className="text-xs text-muted-foreground">Administrator</span>
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
            Wyloguj się
          </Button>
        </form>
      </div>
    </aside>
  )
}
