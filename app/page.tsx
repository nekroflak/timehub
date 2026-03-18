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
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl text-balance">
            Workforce management
            <br />
            <span className="text-muted-foreground">for modern teams</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            The complete platform for multi-tenant team management. Track time, manage organizations, 
            and keep your workforce organized with powerful role-based access control.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                Learn more
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
              <p className="mt-1 text-sm text-muted-foreground">Uptime guarantee</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">50k+</p>
              <p className="mt-1 text-sm text-muted-foreground">Hours tracked daily</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">1000+</p>
              <p className="mt-1 text-sm text-muted-foreground">Organizations</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">30%</p>
              <p className="mt-1 text-sm text-muted-foreground">Time saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Everything you need</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to manage your entire workforce from a single platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Time Tracking</h3>
              <p className="text-muted-foreground">
                Intuitive calendar-based time tracking. Workers log hours daily with optional descriptions.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-muted-foreground">
                Invite team members, assign roles, and manage permissions with granular control.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-tenant</h3>
              <p className="text-muted-foreground">
                Create and manage multiple organizations. Perfect for agencies and enterprise.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Role-based Access</h3>
              <p className="text-muted-foreground">
                Three-tier role system: Super Admin, Company Admin, and Worker with isolated permissions.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reports & Analytics</h3>
              <p className="text-muted-foreground">
                View time reports by team member, date range, and generate insights for your organization.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Personal Notes</h3>
              <p className="text-muted-foreground">
                Private note-taking for workers. Keep track of tasks, ideas, and personal reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-card border-y">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your team up and running in minutes with our simple setup process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Organization</h3>
              <p className="text-muted-foreground">
                Super admins create organizations and set up the initial structure for each company.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Invite Your Team</h3>
              <p className="text-muted-foreground">
                Send invitations to company admins and workers. They sign up through secure invite links.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Tracking</h3>
              <p className="text-muted-foreground">
                Team members log their time, admins view reports, and everyone stays organized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl text-balance">
            Ready to streamline your workforce?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of organizations already using TeamHub to manage their teams effectively.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                Get started today
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Invite-only signup
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
              Built for modern teams. Secure, scalable, and simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
