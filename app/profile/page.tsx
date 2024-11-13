'use client'

import { useAppStore } from '@/app/store'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { useUserStats } from '@/app/hooks/user'
import { toast } from 'sonner'
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar'
import { AppSidebar } from '../components/sidebar'

export default function ProfilePage() {
  const user = useAppStore((state) => state.user)
  const { stats, error, retry } = useUserStats(user?.id)

  if (error) {
    toast.error('Unable to retrieve stats', {
      description: 'Please try again',
      duration: 5000,
      action: retry && {
        label: 'Retry',
        onClick: () => retry(),
      },
    })
  }

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className='flex flex-col items-center justify-center min-h-screen'>
            <Card className='w-full max-w-md'>
              <CardHeader>
                <CardTitle className='text-2xl'>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div>
                    <p>Email: {user.email}</p>
                    {stats && (
                      <>
                        <p>Points: {stats.points}</p>
                        <p>Streak: {stats.streak}</p>
                      </>
                    )}
                    {/* Display past predictions */}
                  </div>
                ) : (
                  <p>Please log in.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
