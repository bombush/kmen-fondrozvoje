import { useQuery } from '@tanstack/react-query'
import { PledgeCrud } from '@/lib/services/crud/pledge-crud'

const pledgeCrud = new PledgeCrud()

export function useProjectBalance(projectId?: string) {
  return useQuery({
    queryKey: ['projectBalance', projectId],
    queryFn: async () => {
      if (!projectId) return 0
      const pledges = await pledgeCrud.getByProjectId(projectId)
      // Sum up all non-deleted pledges
      return pledges
        .filter(pledge => !pledge.deleted)
        .reduce((sum, pledge) => sum + pledge.amount, 0)
    },
    enabled: !!projectId
  })
} 