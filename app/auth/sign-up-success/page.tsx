import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Sprawdź swoją skrzynkę</CardTitle>
          <CardDescription className="text-base">
            Wysłaliśmy Ci link potwierdzający. Sprawdź e-mail, aby zweryfikować swoje konto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Po potwierdzeniu e-maila będziesz mógł się zalogować i przejść do swojego miejsca pracy.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              Przejdź do logowania
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
