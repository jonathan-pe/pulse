import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/app/components/ui/sonner'
import { ThemeProvider } from '@/app/components/theme-provider'

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Sports Prediction App',
  description: 'Gamified sports predictions without real money or prizes',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased min-h-screen`}>
        <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
