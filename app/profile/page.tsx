'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { useUserStats } from '@/app/hooks/user'
import { toast } from 'sonner'
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar'
import { AppSidebar } from '../components/sidebar'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
  const { data } = useSession()
  const user = data?.user as User

  const { stats, error: statsError, retry } = useUserStats(user?.id)

  if (!data || !user) return <div>User data not found.</div>

  if (statsError) {
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
                    <img src={user.image ?? ''} alt='Profile Picture' className='rounded-full w-24 h-24 mx-auto' />
                    <p>Name: {user.name}</p>
                    <p>Email: {user.email}</p>
                    {stats && (
                      <>
                        <p>Points: {stats.points}</p>
                        <p>Longest Streak: {stats.longestStreak}</p>
                        <p>Current Streak: {stats.currentStreak}</p>
                        <p>Correct Predictions: {stats.correctPredictions}</p>
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
