const GameLoading = () => {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
        <div className='aspect-video animate-pulse rounded-xl bg-muted' />
        <div className='aspect-video animate-pulse rounded-xl bg-muted' />
        <div className='aspect-video animate-pulse rounded-xl bg-muted' />
      </div>
      <div className='min-h-screen flex-1 rounded-xl bg-muted md:min-h-min' />
    </div>
  )
}

export default GameLoading
