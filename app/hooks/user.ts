import useSWR, { KeyedMutator } from 'swr'
import { useAppStore } from '@/app/store'
import { fetcher } from '@/utils/clientFetcher'
import { UserStats } from '@/types/user'

interface UserStatsResponse {
  stats: UserStats | null
  error?: Error
  retry?: KeyedMutator<any>
}

export const useUserStats = (userId: string | undefined): UserStatsResponse => {
  const setUserStats = useAppStore((state) => state.setUserStats)

  const { data, error, mutate } = useSWR(userId ? `${process.env.BACKEND_URL}/user/${userId}/stats` : null, fetcher, {
    onSuccess: (data) => {
      setUserStats(data)
    },
    revalidateOnFocus: false,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 1) return
      if (error.status === 404) return

      setTimeout(() => revalidate({ retryCount }), 10000)
    },
  })

  return { stats: data, error, retry: mutate }
}
