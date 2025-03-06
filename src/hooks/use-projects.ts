import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getProjects, getProject, createProject, updateProject, deleteProject } from "@/lib/services/project-service"
import { Project } from "@/types"
import { useRouter } from "next/navigation"

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getProjects
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => getProject(id),
    retry: false
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => 
      createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    }
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => 
      updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    }
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      router.push("/projects")
    }
  })
} 