import { Project } from "@/types"
import { useProjects } from "./use-projects"

export function useFilteredProjects(
  search: string, 
  statusFilter: string,
  showDeleted: boolean = false
) {
  const { data: projects, isLoading } = useProjects(showDeleted)

  const filteredProjects = projects?.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())
      
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "completed" ? project.closed : !project.closed)
      
    return matchesSearch && matchesStatus
  })

  return { projects: filteredProjects, isLoading }
}