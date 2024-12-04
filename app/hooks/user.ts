import useSWR, { KeyedMutator } from 'swr'
import { useAppStore } from '@/app/store'
import { fetcher } from '@/app/lib/fetcher'
import { UserStats } from '@/types/user'
import { gql } from 'graphql-request'

interface UserStatsResponse {
  stats: UserStats | undefined
  error?: Error
  retry?: KeyedMutator<any>
}

interface UserStatsData {
  userStatsByUserId: UserStats
}

const USER_STATS_QUERY = gql`
  query UserStats($userId: String!) {
    userStatsByUserId(userId: $userId) {
      id
      userId
      points
      longestStreak
      currentStreak
      totalPredictions
      correctPredictions
    }
  }
`

export const useUserStats = (userId: string | undefined): UserStatsResponse => {
  const setUserStats = useAppStore((state) => state.setUserStats)

  const { data, error, mutate } = useSWR(
    userId ? [USER_STATS_QUERY, { userId }] : null,
    ([query, variables]) => fetcher<UserStatsData>(query, variables as Record<string, any>),
    {
      onSuccess: (data) => {
        setUserStats(data.userStatsByUserId)
      },
      revalidateOnFocus: false,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 1) return
        if (error.status === 404) return

        setTimeout(() => revalidate({ retryCount }), 10000)
      },
    }
  )

  return { stats: data?.userStatsByUserId, error, retry: mutate }
}
