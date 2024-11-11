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
  title: 'Pulse',
  description: 'Gamified sports predictions without real money or prizes',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased min-h-screen`}>
        {/* <SWRConfig
          value={{
            onError: (error, key) => {
              toast.error(error.message, {
                description: error.description,
                duration: 10000,
                closeButton: true,
              })
            },
            revalidateOnFocus: false,
            onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
              if (retryCount >= 1) return
              if (error.status === 404) return

              setTimeout(() => revalidate({ retryCount }), 10000)
            },
          }}
        > */}
        <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange>
          <div className='mx-auto'>{children}</div>
          <Toaster richColors />
        </ThemeProvider>
        {/* </SWRConfig> */}
      </body>
    </html>
  )
}
