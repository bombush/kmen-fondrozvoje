import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { BankWorkflow } from "@/lib/services/workflows/bank-workflow"
import { CreditWorkflow } from "@/lib/services/workflows/credit-workflow"
import { BankPaymentCrud } from "@/lib/services/crud/bank-crud"

export function usePaymentUserAssignment() {
  const queryClient = useQueryClient()

  const handleUserChange = async (paymentId: string, userId: string, getUserNameById: (id: string) => string) => {
    try {
      const bankWorkflow = new BankWorkflow()
      const updatedUserId = userId === "unassigned" ? "" : userId
      
      await bankWorkflow.updatePaymentUserAssignment(paymentId, updatedUserId)
      
      // @TODO: this should be left in the UI layer, not here
      toast.success("User assignment updated", {
        description: userId === "unassigned" 
          ? "Payment is now unassigned"
          : `Payment assigned to ${getUserNameById(userId)}`
      })

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })

      // update credit allocation
      const creditWorkflow = new CreditWorkflow()
      // get payment month  
      const bankPaymentCrud = new BankPaymentCrud()
      const payment = await bankPaymentCrud.getById(paymentId)

      if(payment) {
        const month = payment.receivedAt.substring(0, 7)
        // update credit allocation
        await creditWorkflow.updateCreditAllocationBasedOnPayments(month)
        queryClient.invalidateQueries({ queryKey: ['userBalance'] })
        queryClient.invalidateQueries({ queryKey: ['creditAwards'] })
        queryClient.invalidateQueries({ queryKey: ['creditAllocations'] })
        queryClient.invalidateQueries({ queryKey: ['creditAllocationHistory'] })

      } else {
        // throw terrible error
        console.error("Payment not found when updating user assignment. That should NEVEN happen")
        throw new Error("Payment not found when updating user assignment. That should NEVEN happen")
      }
      
    } catch (error) {
      toast.error("Failed to update user assignment", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
      console.trace(error)
    }
  }

  return handleUserChange
} 