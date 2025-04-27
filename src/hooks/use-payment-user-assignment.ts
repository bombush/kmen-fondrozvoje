import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { BankWorkflow } from "@/lib/services/workflows/bank-workflow"

export function usePaymentUserAssignment() {
  const queryClient = useQueryClient()

  const handleUserChange = async (paymentId: string, userId: string, getUserNameById: (id: string) => string) => {
    try {
      const bankWorkflow = new BankWorkflow()
      const updatedUserId = userId === "unassigned" ? null : userId
      
      await bankWorkflow.updatePaymentUserAssignment(paymentId, updatedUserId)
      
      toast.success("User assignment updated", {
        description: userId === "unassigned" 
          ? "Payment is now unassigned"
          : `Payment assigned to ${getUserNameById(userId)}`
      })

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['userBalance'] })
      queryClient.invalidateQueries({ queryKey: ['creditAwards'] })
      
    } catch (error) {
      toast.error("Failed to update user assignment", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  return handleUserChange
} 