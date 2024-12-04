import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'

import './globals.css'

import { Toaster } from '@/app/components/ui/sonner'
import { ThemeProvider } from '@/app/components/theme-provider'
import { SessionProvider } from 'next-auth/react'
import { SidebarInset, SidebarProvider } from './components/ui/sidebar'
import { AppSidebar } from './components/sidebar'
import { auth } from '@/auth'

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Pulse',
  description: 'Gamified sports predictions without real money or prizes',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased min-h-screen`}>
        <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange>
          <SessionProvider>
            <SidebarProvider>
              {session && <AppSidebar />}

              <SidebarInset>{children}</SidebarInset>
              <Toaster richColors />
            </SidebarProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
