import { Project } from "@/types"
import { useProjects } from "./use-projects"

export function useFilteredProjects(search: string, statusFilter: string) {
  const { data: projects, isLoading } = useProjects()

  const filteredProjects = projects?.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "completed" ? project.completed : !project.completed)
    return matchesSearch && matchesStatus
  })

  return { projects: filteredProjects, isLoading }
} 