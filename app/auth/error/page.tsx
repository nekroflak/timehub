import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-semibold">Błąd uwierzytelniania</CardTitle>
          <CardDescription className="text-base">
            Coś poszło nie tak podczas logowania. Spróbuj ponownie.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/auth/login">
            <Button className="w-full">
              Wróć do logowania
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Przejdź na stronę główną
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
