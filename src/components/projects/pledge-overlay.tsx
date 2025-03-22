"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useUserBalance } from "@/hooks/use-user-balance"
import { useProjectBalance } from "@/hooks/use-project-balance"
import { useProject } from "@/hooks/use-projects"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PledgeCrud } from "@/lib/services/crud/pledge-crud"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Project } from "@/types"

interface PledgeOverlayProps {
  userId: string
  projectId: string
  open: boolean
  onClose: () => void
}

const pledgeCrud = new PledgeCrud()

export function PledgeOverlay({ userId, projectId, open, onClose }: PledgeOverlayProps) {
  const [amount, setAmount] = useState(0)
  const [maxAmount, setMaxAmount] = useState(0)
  const queryClient = useQueryClient()
  
  // Get user's current balance
  const { data: userBalance = 0, isLoading: isLoadingBalance } = useUserBalance(userId)
  
  // Get project details
  const { data: project, isLoading: isLoadingProject } = useProject(projectId)
  const { data: currentPledged = 0 } = useProjectBalance(projectId)
  
  // Get user's existing pledge for this project if any
  const { data: existingPledge, isLoading: isLoadingPledge } = useQuery({
    queryKey: ['userPledge', userId, projectId],
    queryFn: async () => {
      const pledges = await pledgeCrud.getByUserId(userId)
      return pledges.find(pledge => 
        pledge.projectId === projectId && !pledge.deleted
      ) || null
    }
  })
  
  // Create/update pledge mutation
  const pledgeMutation = useMutation({
    mutationFn: async () => {
      if (existingPledge) {
        // Update existing pledge
        if (amount === 0) return pledgeCrud.softDelete(existingPledge.id)

        return pledgeCrud.update(existingPledge.id, {
          amount,
          description: "Updated pledge"
        })
      } else {
        // Create new pledge
        return pledgeCrud.create({
          userId,
          projectId,
          amount,
          description: "New pledge"
        })
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['projectBalance', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projectPledges', projectId] })
      queryClient.invalidateQueries({ queryKey: ['userPledge', userId, projectId] })
      queryClient.invalidateQueries({ queryKey: ['userBalance', userId] })
      
      toast.success("Pledge saved successfully")
      onClose()
    },
    onError: (error: any) => {
      console.error("Pledge error:", error)
      toast.error("Failed to save pledge", {
        description: error?.message || "An unknown error occurred"
      })
    }
  })
  
  // Calculate max amount when dependencies change
  useEffect(() => {
    if (project && userBalance !== undefined) {
      // Amount left to reach goal
      const sliderMax = calculateSliderMax(existingPledge, project, currentPledged)
      
      //@TODO: what if goal is lower than current pledged?
      
      // If user already has a pledge, add it to available balance
      const availableBalance = existingPledge 
        ? userBalance + existingPledge.amount
        : userBalance
        
      // Max amount is the smaller of amount left or user's balance
      const max = Math.min(sliderMax, availableBalance)
      console.log("sliderMax", sliderMax)
      setMaxAmount(max)
      
      // If user has an existing pledge, set that as default
      if (existingPledge) {
        setAmount(existingPledge.amount)
      } else {
        // Otherwise set to 0 or max/2 if there's available balance
        setAmount(max > 0 ? Math.floor(max / 2) : 0)
      }
    }
  }, [project, userBalance, currentPledged, existingPledge])
  
  const handleSliderChange = (value: number[]) => {
    setAmount(value[0])
  }
  
  const isLoading = isLoadingBalance || isLoadingProject || isLoadingPledge || pledgeMutation.isPending
  const remainingToGoal = project ? calculateSliderMax(existingPledge, project, currentPledged) : 0
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pledge to Project</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Project</span>
                  <span className="font-medium">{project?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your balance</span>
                  <span className="font-medium">{userBalance} CREDITS</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining to goal</span>
                  <span className="font-medium">{remainingToGoal} CREDITS</span>
                </div>
                {existingPledge && (
                  <div className="flex justify-between">
                    <span>Your current pledge</span>
                    <span className="font-medium">{existingPledge.amount} CREDITS</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="pledge-amount">
                    Your pledge amount
                  </label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="pledge-amount"
                      value={[amount]}
                      max={maxAmount}
                      step={1}
                      onValueChange={handleSliderChange}
                      className="flex-1"
                    />
                    <div className="w-16 text-right font-bold text-lg">
                      {amount}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>0</span>
                  <span>{maxAmount}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={() => pledgeMutation.mutate()} 
            disabled={isLoading}
          >
            {pledgeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : existingPledge ? "Update Pledge" : "Pledge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 

function calculateSliderMax(existingPledge: import("/home/stribro/data/work/kmen-fondrozvoje/kmen-fondrozvoje/src/types/index").Pledge | null | undefined, project: Project, currentPledged: number) {
  return existingPledge
    ? Math.max(0, project.goal - currentPledged + existingPledge.amount)
    : Math.max(0, project.goal - currentPledged)
}
