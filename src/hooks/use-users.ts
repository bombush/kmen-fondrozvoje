import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserCrud } from "@/lib/services/crud/user-crud"
import { UserWorkflow, UpdateUserInput } from "@/lib/services/workflows/user-workflow"
import { User } from "@/types"

const userCrud = new UserCrud()
const userWorkflow = new UserWorkflow()

// Get all users (with option to include inactive)
export function useUsers(includeInactive = false) {
  return useQuery({
    queryKey: ['users', { includeInactive }],
    queryFn: async () => {
      const users = await userCrud.getAll()
      return includeInactive 
        ? users 
        : users.filter(user => user.isActive !== false)
    }
  })
}

// Get single user by ID
export function useUser(id?: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userCrud.getById(id as string),
    enabled: !!id
  })
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) => 
      userCrud.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}

// Delete (deactivate) user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => userWorkflow.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
} 