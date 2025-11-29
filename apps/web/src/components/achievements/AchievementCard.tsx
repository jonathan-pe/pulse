import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Trophy, Lock, Star, Award, Flame, Target } from 'lucide-react'
import type { AchievementWithProgress, AchievementCategory, AchievementRarity } from '@pulse/types'

interface AchievementCardProps {
  achievement: AchievementWithProgress
  onClick?: () => void
  isSelectable?: boolean
  isSelected?: boolean
}

// Map categories to icons
const categoryIcons: Record<AchievementCategory, typeof Trophy> = {
  STREAK: Flame,
  MILESTONE: Target,
  LEAGUE_EXPERTISE: Star,
  SOCIAL: Award,
  SPECIAL: Trophy,
}

// Map rarity to colors
const rarityColors: Record<AchievementRarity, string> = {
  COMMON: 'bg-gray-500',
  RARE: 'bg-blue-500',
  EPIC: 'bg-purple-500',
  LEGENDARY: 'bg-yellow-500',
}

const rarityTextColors: Record<AchievementRarity, string> = {
  COMMON: 'text-gray-700 dark:text-gray-300',
  RARE: 'text-blue-700 dark:text-blue-300',
  EPIC: 'text-purple-700 dark:text-purple-300',
  LEGENDARY: 'text-yellow-700 dark:text-yellow-300',
}

export function AchievementCard({ achievement, onClick, isSelectable, isSelected }: AchievementCardProps) {
  const Icon = categoryIcons[achievement.category]
  const isLocked = !achievement.isUnlocked

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`
              relative transition-all duration-200 cursor-pointer
              ${isLocked ? 'opacity-60 grayscale' : 'hover:shadow-md'}
              ${isSelectable && isSelected ? 'ring-2 ring-primary' : ''}
            `}
            onClick={onClick}
          >
            {/* Rarity indicator */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${rarityColors[achievement.rarity]}`} />

            <CardContent className='pt-6 pb-4 px-4'>
              <div className='flex items-start gap-3'>
                {/* Icon */}
                <div
                  className={`
                    p-2 rounded-full 
                    ${isLocked ? 'bg-muted' : `${rarityColors[achievement.rarity]} bg-opacity-20`}
                  `}
                >
                  {isLocked ? (
                    <Lock className='h-6 w-6 text-muted-foreground' />
                  ) : (
                    <Icon className={`h-6 w-6 ${rarityTextColors[achievement.rarity]}`} />
                  )}
                </div>

                {/* Content */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-2 mb-1'>
                    <h4 className='font-semibold text-sm truncate'>{achievement.name}</h4>
                    <Badge variant='outline' className='text-xs'>
                      {achievement.rarity}
                    </Badge>
                  </div>

                  <p className='text-xs text-muted-foreground mb-2 line-clamp-2'>{achievement.description}</p>

                  {/* Progress bar (only for locked achievements) */}
                  {isLocked && (
                    <div className='space-y-1'>
                      <Progress value={achievement.progressPercentage} className='h-1.5' />
                      <p className='text-xs text-muted-foreground'>
                        {achievement.progress} / {achievement.maxProgress}
                      </p>
                    </div>
                  )}

                  {/* Unlocked date */}
                  {!isLocked && achievement.unlockedAt && (
                    <p className='text-xs text-muted-foreground'>
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <div className='max-w-xs'>
            <p className='font-semibold mb-1'>{achievement.name}</p>
            <p className='text-sm text-muted-foreground'>{achievement.description}</p>
            {isLocked && (
              <p className='text-xs text-muted-foreground mt-2'>
                Progress: {achievement.progressPercentage.toFixed(0)}%
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
