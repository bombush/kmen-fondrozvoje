import Link from "next/link"
import { Project } from "@/types"
import { formatMoney } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useProjectBalance } from "@/hooks/use-project-balance"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectCardProps {
  project: Project
}

// load current amount from project crud

export function ProjectCard({ project }: ProjectCardProps) {
  // Load current amount from pledges
  const { data: currentAmount = 0, isLoading } = useProjectBalance(project.id)
  
  // Calculate completion percentage
  const percentComplete = Math.min(Math.round((currentAmount / project.goal) * 100), 100)
  
  // Determine progress color based on percentage
  const progressColorClass = percentComplete >= 100 
    ? "bg-green-500" 
    : percentComplete > 60 
      ? "bg-blue-500" 
      : "bg-primary"

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:bg-muted/50 h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{project.name}</CardTitle>
            <Badge variant={project.closed ? "default" : "secondary"}>
              {project.closed ? "Completed" : "Active"}
            </Badge>
          </div>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              {isLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <span>{currentAmount}/{project.goal}</span>
              )}
              <span className="font-medium">{isLoading ? "..." : `${percentComplete}%`}</span>
            </div>
            <Progress 
              value={isLoading ? 0 : percentComplete} 
              className="h-2"
              indicatorClassName={progressColorClass}
            />
            <div className="flex justify-between text-sm mt-2">

            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 