import { useQuery } from '@tanstack/react-query'
import { UserCrud } from '@/lib/services/crud/user-crud'

const userCrud = new UserCrud()

export function useUserBalance(userId?: string) {
  return useQuery({
    queryKey: ['userBalance', userId],
    queryFn: () => userId ? userCrud.getBalance(userId) : 0,
    enabled: !!userId
  })
} 