'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import type { TimeEntry } from '@/lib/types'

interface DownloadPdfButtonProps {
  orgName: string
  workerName: string
  workerEmail: string
  month: string
  entries: TimeEntry[]
  config: {
    hours_per_day: number
    hourly_rate: number
    overtime_multiplier: number
    currency: string
  }
}

export function DownloadPdfButton({
  orgName,
  workerName,
  workerEmail,
  month,
  entries,
  config,
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const { generateWorkerPdf } = await import('@/lib/pdf')
      generateWorkerPdf({ orgName, workerName, workerEmail, month, entries, config })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} variant="outline">
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Pobierz raport PDF
    </Button>
  )
}
