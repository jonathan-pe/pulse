import { LoginForm } from '@/app/components/login-form'
import { AppSidebar } from '@/app/components/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb'
import { Separator } from '@/app/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/app/components/ui/sidebar'
import { createClient } from '@/utils/supabase/server'
import OneTapComponent from './components/google-one-tap'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log(user)

  if (!user) {
    return (
      <div className='flex h-screen w-full items-center justify-center px-4'>
        <OneTapComponent />
        <LoginForm />
      </div>
    )
  }

  return (
    <div className='p-5 max-w-5xl mx-auto space-y-8'>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href='#'>Building Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className='flex flex-1 flex-col gap-4 p-4'>
            <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
              <div className='aspect-video rounded-xl bg-muted/50' />
              <div className='aspect-video rounded-xl bg-muted/50' />
              <div className='aspect-video rounded-xl bg-muted/50' />
            </div>
            <div className='min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min' />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
