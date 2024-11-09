import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/app/components/ui/sonner'
import { ThemeProvider } from '@/app/components/theme-provider'
import { Separator } from '@radix-ui/react-separator'
import { AppSidebar } from './components/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from './components/ui/breadcrumb'
import { SidebarProvider, SidebarInset, SidebarTrigger } from './components/ui/sidebar'

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
          <div className='mx-auto'>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
          </div>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
