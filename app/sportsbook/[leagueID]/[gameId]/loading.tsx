const GameLoading = () => {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
        <div className='aspect-video rounded-xl bg-muted animate-pulse' />
        <div className='aspect-video rounded-xl bg-muted animate-pulse' />
        <div className='aspect-video rounded-xl bg-muted animate-pulse' />
      </div>
      <div className='min-h-[100vh] flex-1 rounded-xl bg-muted md:min-h-min' />
    </div>
  )
}

export default GameLoading