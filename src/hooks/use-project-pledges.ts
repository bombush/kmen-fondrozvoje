import { useQuery } from '@tanstack/react-query'
import { PledgeCrud } from '@/lib/services/crud/pledge-crud'
import { UserCrud } from '@/lib/services/crud/user-crud'

const pledgeCrud = new PledgeCrud()
const userCrud = new UserCrud()

export function useProjectPledges(projectId?: string) {
  return useQuery({
    queryKey: ['projectPledges', projectId],
    queryFn: async () => {
      if (!projectId) return []
      
      // Get all pledges for the project
      const pledges = await pledgeCrud.getByProjectId(projectId)
      
      // Filter out deleted pledges
      const activePledges = pledges.filter(pledge => !pledge.deleted)
      
      // Load user data for each pledge
      const pledgesWithUserData = await Promise.all(
        activePledges.map(async (pledge) => {
          const user = await userCrud.getById(pledge.userId)
          return {
            ...pledge,
            userName: user?.name || 'Unknown user',
            userEmail: user?.email || ''
          }
        })
      )
      
      // Sort by date (newest first)
      return pledgesWithUserData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    },
    enabled: !!projectId
  })
} 