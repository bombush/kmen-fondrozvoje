import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getProjects, getProject, createProject, updateProject, deleteProject, undoDeleteProject } from "@/lib/services/project-service"
import { Project } from "@/types"
import { useRouter } from "next/navigation"

export function useProjects(includeDeleted = false) {
  return useQuery({
    queryKey: ["projects", { includeDeleted }],
    queryFn: () => getProjects(includeDeleted)
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
    mutationFn: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "deleted">) => 
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
    onSuccess: (deletedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      // Only navigate away if we're on the project detail page
      if (window.location.pathname.includes(`/projects/${deletedProject.id}`)) {
        router.push("/projects")
      }
    }
  })
}

export function useUndoDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: undoDeleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    }
  })
}