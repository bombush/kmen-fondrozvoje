/**
 * Project details page
 * Shows project info and allows editing
 */
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Project } from "@/types"
import { AlertTriangle } from "lucide-react"
import { MotionFade } from "@/components/ui/motion-fade"
import { toast } from "sonner"

/**
 * The page shows all the project details and buttons:
 * - Edit project (if user has privileges)
 * - Delete project (if user has privileges)
 * 
 *  Will also contain List of users with their pledges
 * 
 * When switched to edit mode, all the fields should be editable.
 * When Delete project button is clicked, a confirmation dialog should be shown.
 * 
 * @param param0 
 * @returns 
 */
export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { data: project, isLoading } = useProject(id)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState<Project | undefined>(undefined)

  useEffect(() => {
    if (project) {
      setEditedProject(project)
    }
  }, [project])

  const handleSave = async () => {
    if (!editedProject) return
    
    try {
      await updateProject.mutateAsync({
        id,
        data: {
          name: editedProject.name,
          description: editedProject.description,
          goal: editedProject.goal,
          completed: editedProject.completed,
          url: editedProject.url
        }
      })
      setIsEditing(false)
      toast.success("Project updated", {
        description: "Your changes have been saved successfully."
      })
    } catch (error) {
      toast.error("Failed to update", {
        description: "There was a problem saving your changes. Please try again."
      })
      console.error('Failed to update project:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(id)
      toast.success("Project deleted", {
        description: "The project has been successfully deleted."
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete the project. Please try again."
      })
      console.error('Failed to delete project:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  
  if (!project) {
    return (
      <MotionFade>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-lg font-medium">
              {deleteProject.isSuccess ? "Project deleted" : "Project not found"}
            </span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push("/projects")}
          >
            Go to Projects List
          </Button>
        </div>
      </MotionFade>
    )
  }

  if (!editedProject) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Created by {project.ownerId}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          {isEditing ? (
            <Button 
              onClick={handleSave}
              disabled={updateProject.isPending}
            >
              {updateProject.isPending ? "Saving..." : "Save"}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={deleteProject.isPending}
                >
                  {deleteProject.isPending ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this project? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label>Name</label>
                <Input 
                  value={editedProject.name}
                  onChange={e => setEditedProject({
                    ...editedProject,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label>Description</label>
                <Textarea 
                  value={editedProject.description}
                  onChange={e => setEditedProject({
                    ...editedProject,
                    description: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label>Goal</label>
                <Input 
                  type="number"
                  value={editedProject.goal}
                  onChange={e => setEditedProject({
                    ...editedProject,
                    goal: parseInt(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-2">
                <label>Status</label>
                <select
                  value={editedProject.completed ? "completed" : "active"}
                  onChange={e => setEditedProject({
                    ...editedProject,
                    completed: e.target.value === "completed"
                  })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <Badge variant={project.completed ? "default" : "secondary"}>
                  {project.completed ? "Completed" : "Active"}
                </Badge>
              </div>
              <p>{project.description}</p>
              <div>Goal: {formatMoney(project.goal)}</div>
              {project.url && (
                <div>
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Project URL
                  </a>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pledges</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pledges table will go here */}
        </CardContent>
      </Card>
    </div>
  )
} 