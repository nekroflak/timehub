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
  FileText,
  KanbanSquare,
  CheckSquare,
  Phone,
  Mail,
  Linkedin,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-bold">SimplyDesk</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funkcje
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Jak to działa
            </a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Kontakt
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
            Uporządkuj czas pracy, zadania
            <br />
            <span className="text-muted-foreground">i akceptacje w jednym miejscu</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            SimplyDesk pomaga małym firmom i zespołom zarządzać czasem pracy, zadaniami i miesięcznymi
            rozliczeniami bez chaosu, Excela i rozproszonych wiadomości.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contact">
              <Button size="lg" className="gap-2">
                Umów demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" size="lg">
                Zobacz, jak to działa
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Dla małych i rozwijających się zespołów, które chcą mieć większą kontrolę nad pracą i rozliczeniami.
          </p>
        </div>
      </section>

      {/* Value / Benefits Section */}
      <section className="border-y bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Mniej chaosu, więcej kontroli</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="font-semibold">Jedno miejsce dla zespołu</p>
              <p className="mt-1 text-sm text-muted-foreground">Czas pracy, zadania, akceptacje i raporty w jednym systemie.</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">Przejrzyste role i dostęp</p>
              <p className="mt-1 text-sm text-muted-foreground">Każdy widzi tylko to, czego potrzebuje — bez mieszania danych między firmami i użytkownikami.</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">Gotowe do codziennego użycia</p>
              <p className="mt-1 text-sm text-muted-foreground">System wspiera realny obieg pracy: wpisy czasu, akceptacje, zadania i raporty.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Najważniejsze funkcje w jednym systemie</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Wszystko, czego potrzebujesz do codziennej pracy zespołu — od ewidencji czasu po zadania i raporty.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Czas pracy i nadgodziny</h3>
              <p className="text-muted-foreground">
                Rejestruj czas pracy pracowników, dodawaj urlopy i kontroluj nadgodziny w przejrzystym miesięcznym widoku.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Zatwierdzanie miesięcy pracy</h3>
              <p className="text-muted-foreground">
                Pracownik wysyła miesiąc do akceptacji, a administrator firmy zatwierdza lub odrzuca zgłoszenie z komentarzem.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <KanbanSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tablica zadań dla zespołu</h3>
              <p className="text-muted-foreground">
                Twórz zadania, przypisuj je do pracowników i śledź postęp na prostej tablicy z kolumnami: do zrobienia, przypisane i zrobione.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Raporty PDF</h3>
              <p className="text-muted-foreground">
                Generuj raporty czasu pracy dla pracownika, całej firmy lub wybranego członka zespołu w czytelnej formie PDF.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Notatki i organizacja pracy</h3>
              <p className="text-muted-foreground">
                Każdy użytkownik ma dostęp do własnych notatek, które pomagają porządkować codzienną pracę i ważne informacje.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Role i dostęp dla firmy</h3>
              <p className="text-muted-foreground">
                Super administrator tworzy firmy, administrator firmy zarządza zespołem, a pracownik widzi tylko swoje dane i zadania.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-card border-y">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Jak to działa?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Tworzysz firmę i zapraszasz zespół</h3>
              <p className="text-muted-foreground">
                Super administrator zakłada firmę, a administrator firmy zaprasza pracowników do organizacji.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Zespół rejestruje pracę i realizuje zadania</h3>
              <p className="text-muted-foreground">
                Pracownicy dodają czas pracy, korzystają z tablicy zadań i prowadzą swoje notatki.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Administrator kontroluje i zatwierdza</h3>
              <p className="text-muted-foreground">
                Administrator firmy widzi zespół, raporty i zgłoszenia do akceptacji, a na końcu może pobrać raport PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl text-balance">
            Chcesz zobaczyć, jak SimplyDesk sprawdzi się w Twojej firmie?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Pokażemy Ci, jak uporządkować czas pracy, zadania i proces akceptacji w zespole.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contact">
              <Button size="lg" className="gap-2">
                Umów demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#contact">
              <Button variant="outline" size="lg">
                Skontaktuj się z nami
              </Button>
            </a>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              prosty start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              przejrzysty podział ról
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              raporty PDF
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              akceptacje miesięcy pracy
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              zadania dla zespołu
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32 bg-card border-y">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl text-balance">
            Umów krótkie demo
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            Skontaktuj się, jeśli chcesz zobaczyć jak SimplyDesk może działać w Twojej firmie. Najlepiej napisz lub zadzwoń — odpowiadam osobiście.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="tel:726872551"
              className="flex items-center gap-3 rounded-lg border bg-background px-6 py-4 hover:bg-muted transition-colors"
            >
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="font-semibold">726 872 551</p>
              </div>
            </a>

            <a
              href="mailto:kamilurbanmail@gmail.com"
              className="flex items-center gap-3 rounded-lg border bg-background px-6 py-4 hover:bg-muted transition-colors"
            >
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="font-semibold">kamilurbanmail@gmail.com</p>
              </div>
            </a>

            <a
              href="https://www.linkedin.com/in/kamilurban-/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-background px-6 py-4 hover:bg-muted transition-colors"
            >
              <Linkedin className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">LinkedIn</p>
                <p className="font-semibold">Zobacz profil</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold">SimplyDesk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              SimplyDesk — czas pracy, zadania i akceptacje dla nowoczesnych zespołów
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
