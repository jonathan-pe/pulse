import type { ReactNode } from 'react'

type UpcomingGamesPageLayoutProps = {
  /** Zone A — page context (title). */
  title: ReactNode
  /** Zone D — games feed (e.g. GamesGrid). */
  children: ReactNode
}

/**
 * Shared shell for home and league upcoming-games surfaces.
 * Zones: A context, B scope (filters/sort — Batch 5), C featured (challenges — later), D feed.
 * Zone E (prediction slip) lives in AppHeader.
 */
export function UpcomingGamesPageLayout({ title, children }: UpcomingGamesPageLayoutProps) {
  return (
    <div className='w-full h-full overflow-y-auto'>
      <main className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <div className='flex flex-col gap-6'>
          <section aria-label='Page context'>
            <h2 className='text-2xl sm:text-3xl font-semibold'>{title}</h2>
          </section>

          {/* Zone B — scope controls (sort, league grouping, etc.); wired in Batch 5 */}
          <div data-zone='scope' />

          {/* Zone C — featured strip (e.g. daily challenges); unhide when content exists */}
          <section aria-hidden className='hidden' data-zone='featured' />

          <section aria-label='Upcoming games'>{children}</section>
        </div>
      </main>
    </div>
  )
}
