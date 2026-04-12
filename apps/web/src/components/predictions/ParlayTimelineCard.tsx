import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamLogo } from '@/components/TeamLogo'
import { Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLeagueBadgeColor } from '@/lib/league-colors'
import { getParlayTimelineStatus } from '@/lib/predictions-timeline'
import type { OddsSnapshot, ParlayLegWithGame, ParlayWithLegs } from '@/types/api'

interface ParlayTimelineCardProps {
  parlay: ParlayWithLegs
}

function formatLegPickLine(leg: ParlayLegWithGame): string {
  const game = leg.game
  const odds: OddsSnapshot | null = leg.oddsSnapshot

  if (leg.type === 'MONEYLINE') {
    const team = leg.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
    const teamOdds = leg.pick === 'home' ? odds?.moneyline?.home : odds?.moneyline?.away
    if (teamOdds != null) {
      const oddsFormatted = teamOdds > 0 ? `+${teamOdds}` : `${teamOdds}`
      return `${team} (${oddsFormatted})`
    }
    return `${team} to Win`
  }
  if (leg.type === 'SPREAD') {
    const team = leg.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
    const spread = odds?.spread
    if (spread && spread.value !== undefined) {
      const spreadValue = leg.pick === 'home' ? spread.value : -spread.value
      return `${team} (${spreadValue > 0 ? '+' : ''}${spreadValue})`
    }
    return `${team} to Cover`
  }
  const total = odds?.total
  const side = leg.pick === 'over' ? 'Over' : 'Under'
  if (total && total.value !== undefined) {
    return `${side} ${total.value}`
  }
  return side
}

function formatLegGameStart(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ParlayTimelineCard({ parlay }: ParlayTimelineCardProps) {
  const isSettled = parlay.status !== 'PENDING'
  const isWon = parlay.status === 'WON'
  const isLost = parlay.status === 'LOST'
  const isPush = parlay.status === 'PUSHED'
  const timelineStatus = getParlayTimelineStatus(parlay)

  const uniqueGameIds = new Set(parlay.legs.map((l) => l.gameId))
  const isSingleGameParlay = uniqueGameIds.size === 1
  const primaryGame = parlay.legs[0]!.game

  const leaguesInOrder: string[] = []
  for (const leg of parlay.legs) {
    if (!leaguesInOrder.includes(leg.game.league)) {
      leaguesInOrder.push(leg.game.league)
    }
  }

  const placedLabel = new Date(parlay.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card className='flex flex-col'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            {isSingleGameParlay ? (
              <>
                <div className='flex items-center gap-2'>
                  <TeamLogo
                    teamName={primaryGame.awayTeam.name}
                    teamCode={primaryGame.awayTeam.code}
                    logoUrl={primaryGame.awayTeam.logoUrl}
                    size='sm'
                  />
                  <span className='font-medium text-sm'>{primaryGame.awayTeam.code}</span>
                </div>
                <span className='text-muted-foreground text-sm'>@</span>
                <div className='flex items-center gap-2'>
                  <TeamLogo
                    teamName={primaryGame.homeTeam.name}
                    teamCode={primaryGame.homeTeam.code}
                    logoUrl={primaryGame.homeTeam.logoUrl}
                    size='sm'
                  />
                  <span className='font-medium text-sm'>{primaryGame.homeTeam.code}</span>
                </div>
                <span className='text-muted-foreground text-xs shrink-0 hidden sm:inline'>· Parlay</span>
              </>
            ) : (
              <div className='min-w-0'>
                <div className='font-medium text-sm'>Parlay</div>
                <div className='text-muted-foreground text-xs'>
                  {parlay.legs.length} legs ·{' '}
                  {parlay.ticketType === 'MULTI_GAME' ? 'Multi-game' : 'Same-game'}
                </div>
              </div>
            )}
          </div>

          <div className='flex flex-wrap gap-1 justify-end shrink-0 max-w-[45%]'>
            {leaguesInOrder.map((league) => (
              <Badge key={league} variant='outline' className={getLeagueBadgeColor(league)}>
                {league}
              </Badge>
            ))}
          </div>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <CardDescription className='text-xs'>Placed {placedLabel}</CardDescription>
          {isSettled && isWon && (
            <Badge variant='secondary' className='h-5 text-xs bg-success/10 text-success border-success/20'>
              <CheckCircle className='h-2.5 w-2.5 mr-1' />
              Won
            </Badge>
          )}
          {isSettled && isLost && (
            <Badge variant='destructive' className='h-5 text-xs'>
              Lost
            </Badge>
          )}
          {isSettled && isPush && (
            <Badge variant='secondary' className='h-5 text-xs'>
              Push
            </Badge>
          )}
          {!isSettled && timelineStatus === 'live' && (
            <Badge variant='secondary' className='h-5 text-xs bg-info/10 text-info border-info/20'>
              <Clock className='h-2.5 w-2.5 mr-1' />
              Live
            </Badge>
          )}
          {!isSettled && timelineStatus === 'pending' && (
            <Badge variant='outline' className='h-5 text-xs'>
              <Clock className='h-2.5 w-2.5 mr-1' />
              Upcoming
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='flex-1 pt-0 space-y-4'>
        <ul className='space-y-3'>
          {parlay.legs.map((leg, index) => {
            const g = leg.game
            const hasResult = g.result != null
            const gameStarted = new Date(g.startsAt) <= new Date()
            const legStatus =
              leg.outcome === 'WIN' ? 'win' : leg.outcome === 'LOSS' ? 'loss' : leg.outcome === 'PUSH' ? 'push' : null

            return (
              <li key={leg.id} className={cn(index > 0 && 'border-t pt-3')}>
                <div className='flex items-start justify-between gap-2 mb-2'>
                  <div className='flex flex-col gap-1 min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <TeamLogo
                        teamName={g.awayTeam.name}
                        teamCode={g.awayTeam.code}
                        logoUrl={g.awayTeam.logoUrl}
                        size='sm'
                      />
                      <span className='text-xs font-medium'>{g.awayTeam.code}</span>
                      <span className='text-muted-foreground text-xs'>@</span>
                      <TeamLogo
                        teamName={g.homeTeam.name}
                        teamCode={g.homeTeam.code}
                        logoUrl={g.homeTeam.logoUrl}
                        size='sm'
                      />
                      <span className='text-xs font-medium'>{g.homeTeam.code}</span>
                    </div>
                    <div className='text-[10px] text-muted-foreground'>{formatLegGameStart(g.startsAt)}</div>
                  </div>
                  <div className='flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 shrink-0 self-start'>
                    <Badge variant='outline' className={cn('text-[10px] h-5', getLeagueBadgeColor(g.league))}>
                      {g.league}
                    </Badge>
                    {legStatus && (
                      <Badge
                        variant='secondary'
                        className={cn(
                          'text-[10px] h-5',
                          legStatus === 'win' && 'bg-success/15 text-success border-success/30',
                          legStatus === 'loss' && 'bg-destructive/15 text-destructive border-destructive/30'
                        )}
                      >
                        {legStatus === 'win' ? 'Leg win' : legStatus === 'loss' ? 'Leg loss' : 'Push'}
                      </Badge>
                    )}
                    {!hasResult && gameStarted && (
                      <Badge variant='secondary' className='text-[10px] h-5 bg-info/10 text-info border-info/20'>
                        Live
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className='text-[10px] font-medium text-muted-foreground uppercase'>{leg.type}</span>
                  <div className='text-sm font-medium'>{formatLegPickLine(leg)}</div>
                </div>
              </li>
            )
          })}
        </ul>

        {parlay.pointsEarned != null && parlay.pointsEarned !== 0 && (
          <div className='flex items-center justify-end gap-2 pt-2 border-t'>
            <div
              className={cn(
                'text-xl font-bold flex items-center gap-1',
                parlay.pointsEarned > 0 && 'text-success',
                parlay.pointsEarned < 0 && 'text-destructive'
              )}
            >
              <TrendingUp className='h-3.5 w-3.5' />
              {parlay.pointsEarned > 0 ? `+${parlay.pointsEarned}` : parlay.pointsEarned}
            </div>
            <span className='text-xs text-muted-foreground'>pts</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
