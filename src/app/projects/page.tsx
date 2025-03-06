/**
 * Projects page
 * List of projects with search and status filters
 */
"use client"

import { useState } from "react"
import { useProjects } from "@/hooks/use-projects"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Project } from "@/types"

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all")

  const filteredProjects = projects?.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "completed" ? project.completed : !project.completed)
    return matchesSearch && matchesStatus
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button>New Project</Button>
      </div>

      <div className="flex gap-4">
        <Input 
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select 
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as any)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects?.map((project: Project) => (
          <div key={project.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-2">
              <div className="text-sm">Goal: {formatMoney(project.goal)}</div>
              <div className="text-sm">Status: {project.completed ? "Completed" : "Active"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
