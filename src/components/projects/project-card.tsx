import Link from "next/link"
import { Project } from "@/types"
import { formatMoney } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useProjectBalance } from "@/hooks/use-project-balance"
import { Skeleton } from "@/components/ui/skeleton"
import { BanknoteIcon, ShoppingCartIcon, ClipboardListIcon, Lock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProjectCardProps {
  project: Project
}

// load current amount from project crud

export function ProjectCard({ project }: ProjectCardProps) {
  // Load current amount from pledges
  const { data: currentAmount = 0, isLoading } = useProjectBalance(project.id)
  
  // Calculate completion percentage without capping at 100%
  const percentComplete = Math.round((currentAmount / project.goal) * 100)
  
  // Determine progress color based on percentage
  const progressColorClass = 
    percentComplete > 100 
      ? "bg-red-500" // Overpaid - display in red
      : percentComplete === 100 
        ? "bg-green-500" // Exactly 100% - display in green
        : percentComplete > 60 
          ? "bg-blue-500" 
          : "bg-primary"

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:bg-muted/50 h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">
                {project.name}
                {project.url && (
                  <ExternalLink className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
              <Badge variant={project.closed ? "default" : "secondary"}>
                {project.closed ? "Completed" : "Active"}
              </Badge>
              {(percentComplete>100) && (
                <Badge variant="destructive">
                  Overpaid
                </Badge>
              )}
              {project.locked && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <BanknoteIcon 
                size={16} 
                className={project.fundsSentToOwner ? "text-green-500" : "text-red-500"} 
                title={project.fundsSentToOwner ? "Funds sent to owner" : "Funds not sent yet"}
              />
              <ShoppingCartIcon 
                size={16} 
                className={project.bought ? "text-green-500" : "text-red-500"} 
                title={project.bought ? "Item purchased" : "Not purchased yet"}
              />
              <ClipboardListIcon 
                size={16} 
                className={project.addedToAssetList ? "text-green-500" : "text-red-500"} 
                title={project.addedToAssetList ? "Added to asset list" : "Not in asset list"}
              />
            </div>
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
              // For the visual progress bar, still cap at 100% width, but keep the red color
              value={isLoading ? 0 : Math.min(percentComplete, 100)} 
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