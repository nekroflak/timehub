import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'SimplyDesk',
    template: '%s — SimplyDesk',
  },
  description: 'SimplyDesk to prosty system dla małych firm do zarządzania czasem pracy, wnioskami, zadaniami i akceptacjami w jednym miejscu.',
  applicationName: 'SimplyDesk',
  openGraph: {
    title: 'SimplyDesk — czas pracy, wnioski i zadania w jednym miejscu',
    description: 'SimplyDesk to prosty system dla małych firm do zarządzania czasem pracy, wnioskami, zadaniami i akceptacjami w jednym miejscu.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
