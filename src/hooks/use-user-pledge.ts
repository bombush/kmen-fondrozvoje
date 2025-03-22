import { useQuery } from '@tanstack/react-query'
import { PledgeCrud } from '@/lib/services/crud/pledge-crud'

const pledgeCrud = new PledgeCrud()

export function useUserPledge(userId?: string, projectId?: string) {
  return useQuery({
    queryKey: ['userPledge', userId, projectId],
    queryFn: async () => {
      if (!userId || !projectId) return null
      const pledges = await pledgeCrud.getByUserId(userId)
      return pledges.find(pledge => 
        pledge.projectId === projectId && !pledge.deleted
      ) || null
    },
    enabled: !!userId && !!projectId
  })
} 