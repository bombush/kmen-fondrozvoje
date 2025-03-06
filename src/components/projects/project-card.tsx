import { Project } from "@/types"
import { formatMoney } from "@/lib/utils"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{project.name}</h3>
      <p className="text-sm text-muted-foreground">{project.description}</p>
      <div className="mt-2">
        <div className="text-sm">Goal: {formatMoney(project.goal)}</div>
        <div className="text-sm">Status: {project.completed ? "Completed" : "Active"}</div>
      </div>
    </div>
  )
} 