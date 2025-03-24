/**
 * Project details page
 * Shows project info and allows editing
 */
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects"
import { useProjectBalance } from "@/hooks/use-project-balance"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Project } from "@/types"
import { AlertTriangle, Pencil, Clock, CheckCircle, Users, BanknoteIcon, ShoppingCartIcon, ClipboardListIcon, XCircle } from "lucide-react"
import { MotionFade } from "@/components/ui/motion-fade"
import { toast } from "sonner"
import { useProjectPledges } from "@/hooks/use-project-pledges"
import { PledgeList } from "@/components/projects/pledge-list"
import { PledgeOverlay } from "@/components/projects/pledge-overlay"
import { useAuth } from "@/contexts/auth-context"
import { Checkbox } from "@/components/ui/checkbox"

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
  const { data: currentAmount = 0, isLoading: isLoadingBalance } = useProjectBalance(id)
  const { data: pledges = [], isLoading: isLoadingPledges } = useProjectPledges(id)
  const { appUser } = useAuth()
  const [isPledgeOpen, setIsPledgeOpen] = useState(false)
  const [selectedPledge, setSelectedPledge] = useState<any>(null)
  
  // Calculate completion percentage
  const percentComplete = Math.min(Math.round((currentAmount / (project?.goal || 1)) * 100), 100)
  
  // Determine progress color based on percentage
  const progressColorClass = percentComplete >= 100 
    ? "bg-green-500" 
    : percentComplete > 60 
      ? "bg-blue-500" 
      : "bg-primary"
      
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
          closed: editedProject.closed,
          url: editedProject.url,
          fundsSentToOwner: editedProject.fundsSentToOwner,
          bought: editedProject.bought,
          addedToAssetList: editedProject.addedToAssetList
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

  const handleEditPledge = (pledge: any) => {
    setSelectedPledge(pledge)
    setIsPledgeOpen(true)
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
          <Button
          className="bg-green-800 text-white hover:bg-green-600"
          onClick={()=>setIsPledgeOpen(true)}
          >
            Pledge
          </Button>
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
              {/* Funding Progress Section */}
              <div className="space-y-4 mt-6">
                <div className="space-y-3">
                  
                  <Progress 
                    value={isLoadingBalance ? 0 : percentComplete} 
                    className="h-1.5"
                    indicatorClassName={progressColorClass}
                  />
                                   <div className="flex justify-between text-sm">
                    <span className="font-bold">{isLoadingBalance ? "..." : `${percentComplete}%`}</span>
                  </div>
                  
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
              <div className="space-y-4 border rounded-md p-4 mt-6">
                <h3 className="font-medium">Administrative Status</h3>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="fundsSentToOwner" 
                    checked={project.fundsSentToOwner}
                    onCheckedChange={(checked) => 
                      setEditedProject({...editedProject, fundsSentToOwner: checked === true})
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="fundsSentToOwner"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Funds Sent To Owner
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Mark when funds have been transferred to the project owner
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="bought" 
                    checked={project.bought}
                    onCheckedChange={(checked) => 
                      setEditedProject({...editedProject, bought: checked === true})
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="bought"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Item Purchased
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Mark when the project item has been purchased
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="addedToAssetList" 
                    checked={project.addedToAssetList}
                    onCheckedChange={(checked) => 
                      setEditedProject({...editedProject, addedToAssetList: checked === true})
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="addedToAssetList"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Added to Asset List
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Mark when the item has been added to the organization's asset list
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <Badge variant={project.closed ? "default" : "secondary"}>
                  {project.closed ? "Completed" : "Active"}
                </Badge>
              </div>
              <p>{project.description}</p>


              <div>Goal: {project.goal}</div>
              <div className="space-y-2">
                <label>Current Amount: </label>
                {isLoadingBalance ? (
                  <Skeleton className="h-4 w-24" />
                ) : <span>{currentAmount}</span>
                }
              </div>
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
              
              <div className="mt-6 border rounded-md p-4">
                <h3 className="font-medium mb-4">Project Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <BanknoteIcon className={project.fundsSentToOwner ? "text-green-500" : "text-red-500"} size={20} />
                    <div>
                      <div className="font-medium">Funds Sent</div>
                      <div className="text-sm text-muted-foreground">
                        {project.fundsSentToOwner ? "Completed" : "Pending"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ShoppingCartIcon className={project.bought ? "text-green-500" : "text-red-500"} size={20} />
                    <div>
                      <div className="font-medium">Item Purchased</div>
                      <div className="text-sm text-muted-foreground">
                        {project.bought ? "Completed" : "Pending"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ClipboardListIcon className={project.addedToAssetList ? "text-green-500" : "text-red-500"} size={20} />
                    <div>
                      <div className="font-medium">Added to Asset List</div>
                      <div className="text-sm text-muted-foreground">
                        {project.addedToAssetList ? "Completed" : "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pledges</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedPledge(null)
              setIsPledgeOpen(true)
            }}
            disabled={!appUser}
          >
            Pledge to this project
          </Button>
        </CardHeader>
        <CardContent>
          <PledgeList 
            pledges={pledges} 
            isLoading={isLoadingPledges}
            currentUserId={appUser?.id}
            isAdmin={appUser?.role === 'admin'}
            onEditPledge={handleEditPledge}
          />
        </CardContent>
      </Card>

      {appUser && isPledgeOpen && (
        <PledgeOverlay
          userId={selectedPledge?.userId || appUser.id}
          projectId={id}
          pledgeId={selectedPledge?.id}
          open={isPledgeOpen}
          onClose={() => {
            setIsPledgeOpen(false)
            setSelectedPledge(null)
          }}
        />
      )}
    </div>
  )
} 