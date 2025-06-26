"use client"

import { useState } from "react"
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useProjectPledges } from "@/hooks/use-project-pledges"
import { formatMoney } from "@/lib/utils"
import { PledgeCrud } from "@/lib/services/crud/pledge-crud"

interface RedistributeFundsDialogProps {
  projectId: string
  projectName: string
  overageAmount: number
}

export function RedistributeFundsDialog({ 
  projectId, 
  projectName, 
  overageAmount 
}: RedistributeFundsDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: pledges = [] } = useProjectPledges(projectId)
  const queryClient = useQueryClient()
  
  // Calculate the total amount pledged
  const totalPledged = pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
  
  // Calculate reduction amount for each pledge based on their proportion of the total
  const redistributions = pledges.map(pledge => {
    const proportion = pledge.amount / totalPledged
    const reductionAmount = Math.min(pledge.amount - 1, Math.round(overageAmount * proportion))
    
    return {
      pledgeId: pledge.id,
      userId: pledge.userId,
      userName: pledge.userName,
      originalPledge: pledge.amount,
      pledgeDescription: pledge.description,
      // New amount after reduction
      newPledgeAmount: pledge.amount - reductionAmount,
      proportion,
      reductionAmount
    }
  })

  // Actual amount being redistributed
  const totalRedistributed = redistributions.reduce((sum, r) => sum + r.reductionAmount, 0)
  
  const pledgeCrud = new PledgeCrud()
  
  const { mutate: redistributeFunds, isPending } = useMutation({
    mutationFn: async () => {
      // Update each pledge with the reduced amount
      const updatedPledges = await Promise.all(
        redistributions.map(reduction => 
          pledgeCrud.update(reduction.pledgeId, {
            amount: reduction.newPledgeAmount,
            // Add a note about the reduction
            description: `${reduction.pledgeDescription || ''} (Adjusted: -${reduction.reductionAmount} due to project overpayment)`
          })
        )
      )
      return updatedPledges
    },
    onSuccess: () => {
      toast.success("Pledges reduced", {
        description: `Successfully reduced pledges by a total of ${formatMoney(totalRedistributed)}`
      })
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['projectBalance'] })
      queryClient.invalidateQueries({ queryKey: ['projectPledges'] })
      queryClient.invalidateQueries({ queryKey: ['userPledge'] })
      queryClient.invalidateQueries({ queryKey: ['userBalance'] })
    },
    onError: (error) => {
      toast.error("Error", {
        description: `Failed to reduce pledges: ${error.message}`
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="bg-orange-600 text-white hover:bg-orange-500">
          Reduce Overpaid Pledges
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reduce Pledges for Overpayment</DialogTitle>
          <DialogDescription>
            This project is overpaid by {formatMoney(overageAmount)}. Each user's pledge will be reduced 
            proportionally to match the project goal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-80 overflow-y-auto my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">User</th>
                <th className="py-2 text-right">Original Pledge</th>
                <th className="py-2 text-right">Reduction</th>
                <th className="py-2 text-right">New Pledge</th>
              </tr>
            </thead>
            <tbody>
              {redistributions.map((reduction, idx) => (
                <tr key={idx} className="border-b border-muted">
                  <td className="py-2">{reduction.userName}</td>
                  <td className="py-2 text-right">{formatMoney(reduction.originalPledge)}</td>
                  <td className="py-2 text-right">-{formatMoney(reduction.reductionAmount)}</td>
                  <td className="py-2 text-right">{formatMoney(reduction.newPledgeAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{formatMoney(totalPledged)}</td>
                <td className="py-2 text-right">-{formatMoney(totalRedistributed)}</td>
                <td className="py-2 text-right">{formatMoney(totalPledged - totalRedistributed)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => redistributeFunds()}
            disabled={isPending || totalRedistributed === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Reduce Pledges"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 