import Link from "next/link"
import { Project } from "@/types"
import { formatMoney } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{project.name}</CardTitle>
            <Badge variant={project.closed ? "default" : "secondary"}>
              {project.closed ? "Completed" : "Active"}
            </Badge>
          </div>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">Goal: {formatMoney(project.goal)}</div>
        </CardContent>
      </Card>
    </Link>
  )
} 