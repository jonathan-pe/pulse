'use client' // Error boundaries must be Client Components

import './globals.css'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    // global-error must include html and body tags
    <html>
      <body className='flex flex-col items-center justify-center flex-1 min-h-screen w-full'>
        <h2>Oops! Something went wrong.</h2>
        <button onClick={() => reset()}>Please try refreshing the page</button>
      </body>
    </html>
  )
}
