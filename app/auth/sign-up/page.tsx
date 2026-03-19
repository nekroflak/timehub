'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signUp } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Invitation } from '@/lib/types'

function SignUpForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvitation() {
      if (!token) {
        setError('Brak tokenu zaproszenia')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*, organization:organizations(*)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (fetchError || !data) {
        setError('Zaproszenie jest nieprawidłowe lub wygasło')
      } else {
        setInvitation(data as Invitation)
      }
      setLoading(false)
    }

    fetchInvitation()
  }, [token])

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    setError(null)
    
    formData.append('token', token || '')
    const result = await signUp(formData)
    
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Weryfikacja zaproszenia...</div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Nieprawidłowe zaproszenie</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Wróć na stronę główną
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const roleDisplay = invitation?.role === 'admin' ? 'Administrator firmy' : 'Pracownik'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Utwórz konto</CardTitle>
          <CardDescription>
            Zostałeś zaproszony do{' '}
            {invitation?.organization?.name || 'platformy'} jako {roleDisplay}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={invitation?.email}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Imię i nazwisko</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jan Kowalski"
                required
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Utwórz silne hasło"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Tworzenie konta...' : 'Utwórz konto'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Masz już konto?{' '}
            <Link href="/auth/login" className="text-foreground underline underline-offset-4 hover:text-primary">
              Zaloguj się
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Ładowanie...</div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
