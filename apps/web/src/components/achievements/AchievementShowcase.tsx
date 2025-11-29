import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, ChevronRight } from 'lucide-react'
import type { AchievementShowcase as AchievementShowcaseType } from '@pulse/types'
import { AchievementCard } from './AchievementCard'

interface AchievementShowcaseProps {
  showcase: AchievementShowcaseType
  onViewAll?: () => void
}

export function AchievementShowcase({ showcase, onViewAll }: AchievementShowcaseProps) {
  const completionPercentage = (showcase.totalUnlocked / showcase.totalAvailable) * 100

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5' />
              Achievements
            </CardTitle>
            <CardDescription>
              {showcase.totalUnlocked} of {showcase.totalAvailable} unlocked ({completionPercentage.toFixed(0)}%)
            </CardDescription>
          </div>
          {onViewAll && (
            <Button variant='ghost' size='sm' onClick={onViewAll}>
              View All
              <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Displayed Achievements */}
        {showcase.displayedAchievements.length > 0 ? (
          <div className='space-y-4'>
            <div>
              <h4 className='text-sm font-medium mb-3'>Featured Badges</h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                {showcase.displayedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>

            {/* Recent Unlocks */}
            {showcase.recentUnlocks.length > 0 && (
              <div>
                <h4 className='text-sm font-medium mb-3'>Recently Unlocked</h4>
                <div className='space-y-2'>
                  {showcase.recentUnlocks.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className='flex items-center justify-between p-2 rounded-lg bg-muted/50'>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline' className='text-xs'>
                          {achievement.rarity}
                        </Badge>
                        <span className='text-sm font-medium'>{achievement.name}</span>
                      </div>
                      <span className='text-xs text-muted-foreground'>
                        {achievement.unlockedAt &&
                          new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center py-8 text-muted-foreground'>
            <Trophy className='h-12 w-12 mx-auto mb-3 opacity-20' />
            <p className='text-sm'>No achievements unlocked yet</p>
            <p className='text-xs mt-1'>Start making predictions to earn badges!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
