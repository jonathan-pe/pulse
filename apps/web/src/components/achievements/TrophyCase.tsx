import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AchievementCard } from './AchievementCard'
import type { AchievementWithProgress, AchievementCategory } from '@pulse/types'

interface TrophyCaseProps {
  achievements: AchievementWithProgress[]
  onSelectAchievement?: (achievement: AchievementWithProgress) => void
  selectedAchievementIds?: string[]
}

export function TrophyCase({ achievements, onSelectAchievement, selectedAchievementIds = [] }: TrophyCaseProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all')

  // Group achievements by category
  const categories: AchievementCategory[] = ['STREAK', 'MILESTONE', 'LEAGUE_EXPERTISE', 'SOCIAL', 'SPECIAL']

  const filteredAchievements = achievements.filter((ach) => {
    if (activeTab === 'unlocked') return ach.isUnlocked
    if (activeTab === 'locked') return !ach.isUnlocked
    return true
  })

  const groupedByCategory = categories.map((category) => ({
    category,
    achievements: filteredAchievements.filter((ach) => ach.category === category),
  }))

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter((a) => a.isUnlocked).length,
    common: achievements.filter((a) => a.isUnlocked && a.rarity === 'COMMON').length,
    rare: achievements.filter((a) => a.isUnlocked && a.rarity === 'RARE').length,
    epic: achievements.filter((a) => a.isUnlocked && a.rarity === 'EPIC').length,
    legendary: achievements.filter((a) => a.isUnlocked && a.rarity === 'LEGENDARY').length,
  }

  const completionPercentage = (stats.unlocked / stats.total) * 100

  return (
    <div className='space-y-6'>
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Trophy Case</CardTitle>
          <CardDescription>
            {stats.unlocked} of {stats.total} achievements unlocked ({completionPercentage.toFixed(0)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-500'>{stats.common}</div>
              <div className='text-sm text-muted-foreground'>Common</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-500'>{stats.rare}</div>
              <div className='text-sm text-muted-foreground'>Rare</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-500'>{stats.epic}</div>
              <div className='text-sm text-muted-foreground'>Epic</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-500'>{stats.legendary}</div>
              <div className='text-sm text-muted-foreground'>Legendary</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='all'>All ({achievements.length})</TabsTrigger>
          <TabsTrigger value='unlocked'>Unlocked ({stats.unlocked})</TabsTrigger>
          <TabsTrigger value='locked'>Locked ({stats.total - stats.unlocked})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='space-y-6 mt-6'>
          {groupedByCategory.map(
            ({ category, achievements: categoryAchievements }) =>
              categoryAchievements.length > 0 && (
                <div key={category}>
                  <h3 className='text-lg font-semibold mb-3 capitalize'>{category.replace('_', ' ').toLowerCase()}</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {categoryAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        onClick={() => onSelectAchievement?.(achievement)}
                        isSelectable={!!onSelectAchievement}
                        isSelected={selectedAchievementIds.includes(achievement.id)}
                      />
                    ))}
                  </div>
                </div>
              )
          )}

          {filteredAchievements.length === 0 && (
            <div className='text-center py-12 text-muted-foreground'>
              {activeTab === 'unlocked' && 'No achievements unlocked yet. Keep predicting!'}
              {activeTab === 'locked' && 'All achievements unlocked! Amazing work!'}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
