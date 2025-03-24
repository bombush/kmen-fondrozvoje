import { Project } from "@/types"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getProjects } from "@/lib/services/project-service"

export function useFilteredProjects(
  search: string = "",
  statusFilter: "all" | "active" | "completed" = "all",
  showDeleted: boolean = false,
  fundsSentFilter: boolean | null = null,
  boughtFilter: boolean | null = null,
  assetListFilter: boolean | null = null
) {
  console.log("projects hook")
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', showDeleted],
    queryFn: () => getProjects(showDeleted)
  })

  // Apply all filters
  const filteredProjects = useMemo(() => {
    if (!projects) return []

    return projects.filter(project => {
      // Apply search filter
      if (search && !project.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      // Apply status filter
      if (statusFilter === "active" && project.closed) {
        return false
      }

      if (statusFilter === "completed" && !project.closed) {
        return false
      }

      // Apply the new boolean filters
      if (fundsSentFilter !== null && project.fundsSentToOwner !== fundsSentFilter) {
        return false
      }

      if (boughtFilter !== null && project.bought !== boughtFilter) {
        return false
      }

      if (assetListFilter !== null && project.addedToAssetList !== assetListFilter) {
        return false
      }

      return true
    })
  }, [projects, search, statusFilter, showDeleted, fundsSentFilter, boughtFilter, assetListFilter])

  return { projects: filteredProjects, isLoading }
}