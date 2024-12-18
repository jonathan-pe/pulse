import React from 'react'

export default async function Sportsbook() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <h2 className='text-2xl font-bold'>My Predictions</h2>
      <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
        <div className='aspect-video rounded-xl bg-muted' />
        <div className='aspect-video rounded-xl bg-muted' />
        <div className='aspect-video rounded-xl bg-muted' />
      </div>
      <div className='min-h-screen flex-1 rounded-xl bg-muted md:min-h-min' />
    </div>
  )
}
