import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { StatusFilter, LeagueFilter, ResultFilter } from '@/types/filters'
import { LEAGUES } from '@pulse/types'

interface PredictionsFiltersProps {
  statusFilter: StatusFilter
  leagueFilter: LeagueFilter
  resultFilter: ResultFilter
  onStatusChange: (status: StatusFilter) => void
  onLeagueChange: (league: LeagueFilter) => void
  onResultChange: (result: ResultFilter) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function PredictionsFilters({
  statusFilter,
  leagueFilter,
  resultFilter,
  onStatusChange,
  onLeagueChange,
  onResultChange,
  onClearFilters,
  hasActiveFilters,
}: PredictionsFiltersProps) {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={(value: StatusFilter) => onStatusChange(value)}>
        <SelectTrigger className='w-[140px]'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Status</SelectItem>
          <SelectItem value='pending'>Pending</SelectItem>
          <SelectItem value='live'>Live</SelectItem>
          <SelectItem value='completed'>Completed</SelectItem>
        </SelectContent>
      </Select>

      {/* League Filter */}
      <Select value={leagueFilter} onValueChange={(value: LeagueFilter) => onLeagueChange(value)}>
        <SelectTrigger className='w-[130px]'>
          <SelectValue placeholder='League' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Leagues</SelectItem>
          {LEAGUES.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Result Filter */}
      <Select value={resultFilter} onValueChange={(value: ResultFilter) => onResultChange(value)}>
        <SelectTrigger className='w-[130px]'>
          <SelectValue placeholder='Result' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Results</SelectItem>
          <SelectItem value='wins'>Wins Only</SelectItem>
          <SelectItem value='losses'>Losses Only</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant='ghost' size='sm' onClick={onClearFilters} className='h-9 px-3'>
          <X className='h-4 w-4 mr-1' />
          Clear
        </Button>
      )}
    </div>
  )
}
