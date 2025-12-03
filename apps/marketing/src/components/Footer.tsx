export function Footer() {
  return (
    <footer className='py-12 border-t'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
          <div className='flex items-center gap-2'>
            <img src='/pulse_logo.png' alt='Pulse Logo' className='h-6 w-6' />
            <span className='text-lg font-bold'>Pulse</span>
          </div>
          <div className='text-sm text-muted-foreground text-center md:text-right'>
            <p>© 2025 Pulse. All rights reserved.</p>
            <p className='mt-1'>
              Not affiliated with any sports betting or gambling services. For entertainment purposes only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
