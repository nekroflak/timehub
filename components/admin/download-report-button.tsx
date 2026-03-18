'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileDown, Loader2, Building2, User } from 'lucide-react'
import type { TimeEntry, Profile } from '@/lib/types'

interface DownloadReportButtonProps {
  orgName: string
  month: string
  entries: (TimeEntry & { profile: Pick<Profile, 'full_name' | 'email'> | null })[]
}

export function DownloadReportButton({ orgName, month, entries }: DownloadReportButtonProps) {
  const [loading, setLoading] = useState<string | null>(null)

  // Unique employees
  const employees = Array.from(
    new Map(
      entries
        .filter(e => e.profile)
        .map(e => [e.user_id, e.profile!])
    ).entries()
  ).map(([userId, profile]) => ({ userId, profile }))

  async function handleCompanyPdf() {
    setLoading('company')
    try {
      const { generateCompanyPdf } = await import('@/lib/pdf')
      generateCompanyPdf({ orgName, month, entries })
    } finally {
      setLoading(null)
    }
  }

  async function handleEmployeePdf(userId: string, profile: Pick<Profile, 'full_name' | 'email'>) {
    setLoading(userId)
    try {
      const { generateEmployeePdf } = await import('@/lib/pdf')
      const userEntries = entries.filter(e => e.user_id === userId)
      generateEmployeePdf({ orgName, month, employee: profile, entries: userEntries })
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Pobierz raport PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Wybierz raport</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCompanyPdf} disabled={isLoading}>
          <Building2 className="h-4 w-4 mr-2" />
          Raport firmowy (wszyscy)
        </DropdownMenuItem>
        {employees.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Raport pracownika
            </DropdownMenuLabel>
            {employees.map(({ userId, profile }) => (
              <DropdownMenuItem
                key={userId}
                onClick={() => handleEmployeePdf(userId, profile)}
                disabled={isLoading}
              >
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">
                  {profile.full_name || profile.email}
                </span>
                {loading === userId && (
                  <Loader2 className="h-3 w-3 ml-auto animate-spin" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
