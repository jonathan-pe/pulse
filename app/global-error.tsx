'use client' // Error boundaries must be Client Components

import './globals.css'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    // global-error must include html and body tags
    <html lang='en'>
      <body className='flex min-h-screen w-full flex-1 flex-col items-center justify-center'>
        <h2>Oops! Something went wrong.</h2>
        <button onClick={() => reset()}>Please try refreshing the page</button>
      </body>
    </html>
  )
}
