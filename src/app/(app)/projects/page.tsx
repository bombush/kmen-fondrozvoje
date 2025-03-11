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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUndoDeleteProject } from "@/hooks/use-projects"
import { Project } from "@/types"
import { toast } from "sonner"

export default function ProjectsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all")
  const [showDeleted, setShowDeleted] = useState(false)
  const { projects, isLoading } = useFilteredProjects(search, statusFilter, showDeleted)
  const { mutateAsync: undoDelete } = useUndoDeleteProject()

  const handleUndoDelete = async (project: Project) => {
    try {
      await undoDelete(project.id)
      toast.success("Project restored", {
        description: `${project.name} has been restored.`,
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to restore project.",
      })
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button>New Project</Button>
      </div>

      <div className="flex items-center justify-between">
        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="show-deleted" 
            checked={showDeleted} 
            onCheckedChange={setShowDeleted} 
          />
          <Label htmlFor="show-deleted">Show deleted projects</Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map(project => (
          <div key={project.id} className="relative">
            <ProjectCard project={project} />
            {project.deleted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <Button 
                  variant="secondary"
                  onClick={() => handleUndoDelete(project)}
                >
                  Restore Project
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
