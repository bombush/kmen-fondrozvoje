/**
 * Projects page
 * List of projects with search and status filters
 */
"use client"

import { useState } from "react"
import { useFilteredProjects } from "@/hooks/use-filtered-projects"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectFilters } from "@/components/projects/project-filters"
import { Button } from "@/components/ui/button"

export default function ProjectsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all")
  const { projects, isLoading } = useFilteredProjects(search, statusFilter)

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button>New Project</Button>
      </div>

      <ProjectFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
