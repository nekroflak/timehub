import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  Users, 
  Building2, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  BarChart3,
  FileText
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-bold">TeamHub</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funkcje
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Jak to działa
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Zaloguj się</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">Rozpocznij</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl text-balance">
            Zarządzanie pracownikami
            <br />
            <span className="text-muted-foreground">dla nowoczesnych zespołów</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            Kompletna platforma do zarządzania wieloorganizacyjnymi zespołami. Rejestruj czas pracy,
            zarządzaj organizacjami i utrzymuj porządek dzięki kontroli dostępu opartej na rolach.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                Zacznij za darmo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                Dowiedz się więcej
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold">99.9%</p>
              <p className="mt-1 text-sm text-muted-foreground">Gwarancja dostępności</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">50k+</p>
              <p className="mt-1 text-sm text-muted-foreground">Godzin rejestrowanych dziennie</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">1000+</p>
              <p className="mt-1 text-sm text-muted-foreground">Organizacji</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">30%</p>
              <p className="mt-1 text-sm text-muted-foreground">Oszczędność czasu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Wszystko czego potrzebujesz</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Zaawansowane funkcje do zarządzania całym zespołem z jednej platformy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Czas pracy</h3>
              <p className="text-muted-foreground">
                Intuicyjne rejestrowanie czasu pracy w kalendarzu. Pracownicy logują godziny każdego dnia z opcjonalnym opisem.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Zarządzanie zespołem</h3>
              <p className="text-muted-foreground">
                Zapraszaj członków zespołu, przypisuj role i zarządzaj uprawnieniami z precyzyjną kontrolą dostępu.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Wiele organizacji</h3>
              <p className="text-muted-foreground">
                Twórz wiele organizacji i zarządzaj nimi. Idealne dla agencji i dużych firm.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Kontrola dostępu</h3>
              <p className="text-muted-foreground">
                Trzypoziomowy system ról: Super administrator, Administrator firmy i Pracownik z izolowanymi uprawnieniami.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Raporty i analizy</h3>
              <p className="text-muted-foreground">
                Przeglądaj raporty czasu pracy według pracownika, zakresu dat i generuj zestawienia dla organizacji.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Notatki osobiste</h3>
              <p className="text-muted-foreground">
                Prywatne notatki dla pracowników. Zapisuj zadania, pomysły i osobiste przypomnienia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-card border-y">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Jak to działa</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Uruchom swój zespół w kilka minut dzięki prostemu procesowi konfiguracji.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Utwórz organizację</h3>
              <p className="text-muted-foreground">
                Super administratorzy tworzą organizacje i konfigurują strukturę dla każdej firmy.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Zaproś swój zespół</h3>
              <p className="text-muted-foreground">
                Wyślij zaproszenia do administratorów i pracowników. Rejestrują się przez bezpieczne linki.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Zacznij rejestrować</h3>
              <p className="text-muted-foreground">
                Pracownicy rejestrują czas, administratorzy przeglądają raporty, a wszyscy są zorganizowani.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl text-balance">
            Gotowy na sprawniejsze zarządzanie zespołem?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Dołącz do tysięcy organizacji już korzystających z TeamHub do efektywnego zarządzania zespołami.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                Zacznij już dziś
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Bezpłatny start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Bez karty kredytowej
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Rejestracja tylko przez zaproszenie
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold">TeamHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Stworzone dla nowoczesnych zespołów. Bezpieczne, skalowalne i proste.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
