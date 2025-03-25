"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Project } from "@/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ProjectCrud } from "@/lib/services/crud/project-crud"
import { PledgeCrud } from "@/lib/services/crud/pledge-crud"

interface ProjectLockButtonProps {
  project: Project
  isOwnerOrAdmin: boolean
}

export function ProjectLockButton({ project, isOwnerOrAdmin }: ProjectLockButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const projectCrud = new ProjectCrud()
  const pledgeCrud = new PledgeCrud()
  
  const { mutate: toggleLock, isPending } = useMutation({
    mutationFn: async () => {
      // First update the project's locked status
      const updatedProject = await projectCrud.update(project.id, {
        locked: !project.locked
      })
      
      // Then update all associated pledges
      const pledges = await pledgeCrud.getByProjectId(project.id)
      await Promise.all(
        pledges.map(pledge => 
          pledgeCrud.update(pledge.id, { locked: !project.locked })
        )
      )
      
      return updatedProject
    },
    onSuccess: (updatedProject) => {
      const action = updatedProject.locked ? "locked" : "unlocked"
      toast.success(`Project ${action}`, {
        description: `Successfully ${action} the project and all associated pledges.`
      })
      setIsOpen(false)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projectPledges', project.id] })
    },
    onError: (error) => {
      toast.error("Error", {
        description: `Failed to update project: ${error.message}`
      })
    }
  })
  
  // Don't render if user is not owner or admin
  if (!isOwnerOrAdmin) return null
  
  // Don't render if project is not completed
  if (!project.closed) return null
  
  const actionText = project.locked ? "Unlock" : "Lock"
  const icon = project.locked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-blue-600 text-white hover:bg-blue-500"
        >
          {icon}
          {actionText} Project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionText} Project</AlertDialogTitle>
          <AlertDialogDescription>
            {project.locked 
              ? "Unlocking will allow changes to this project and all its pledges. Users will be able to add or remove their pledges."
              : "Locking will prevent any changes to this project and all its pledges. Users won't be able to add or remove their pledges."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              toggleLock()
            }}
            disabled={isPending}
            className={project.locked ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-500"}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {icon}
                {actionText} Project
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 