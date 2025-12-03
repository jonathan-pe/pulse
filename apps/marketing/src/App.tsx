import { Separator } from '@/components/ui/separator'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/sections/Hero'
import { NoGamblingDisclaimer } from '@/components/sections/NoGamblingDisclaimer'
import { Features } from '@/components/sections/Features'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'

const WEB_APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export default function App() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div id='marketing-root' className='min-h-screen'>
      <Navigation appUrl={WEB_APP_URL} onNavigate={scrollToSection} />
      <Hero appUrl={WEB_APP_URL} onLearnMore={() => scrollToSection('how-it-works')} />
      <NoGamblingDisclaimer />
      <Features />
      <Separator />
      <HowItWorks />
      <Separator />
      <FAQ />
      <Separator />
      <CTA appUrl={WEB_APP_URL} />
      <Footer />
    </div>
  )
}
