"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ProjectForm } from "@/components/projects/project-form"
import { PlusCircle } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectWorkflow } from "@/lib/services/workflows/project-workflow"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export function AddProjectDialog() {
  const [open, setOpen] = useState(false)
  const { appUser } = useAuth()
  const queryClient = useQueryClient()
  const projectWorkflow = new ProjectWorkflow()
  
  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return projectWorkflow.createProject({
        ...data,
        ownerId: appUser?.id || "",
        locked: false,
        closed: false,
        fundsSentToOwner: false,
        bought: false,
        addedToAssetList: false
      })
    },
    onSuccess: (newProject) => {
      toast.success("Project created", {
        description: `${newProject.name} has been created successfully.`
      })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error("Error creating project", {
        description: error.message
      })
    }
  })

  // Empty project template for new project
  const emptyProject = {
    name: "",
    description: "",
    goal: 0,
    url: "",
    ownerId: appUser?.id || "",
    closed: false,
    fundsSentToOwner: false,
    bought: false,
    addedToAssetList: false,
    locked: false
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to the system. Fill in the project details below.
          </DialogDescription>
        </DialogHeader>
        
        <ProjectForm 
          project={emptyProject} 
          onSubmit={createProject}
          isLoading={isPending}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  )
} 