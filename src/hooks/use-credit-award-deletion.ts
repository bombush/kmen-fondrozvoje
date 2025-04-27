import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CreditAwardCrud } from "@/lib/services/crud/credit-award-crud"
import { useToast } from "@/components/ui/use-toast"

export function useCreditAwardDeletion() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { mutate: deleteAward, isPending: isDeleting } = useMutation({
    mutationFn: async (awardId: string) => {
      const creditAwardCrud = new CreditAwardCrud()
      return creditAwardCrud.softDelete(awardId)
    },
    onSuccess: () => {
      toast({
        title: "Credit award deleted",
        description: "The credit award has been successfully deleted.",
      })
      queryClient.invalidateQueries({ queryKey: ['creditAwards'] })
      queryClient.invalidateQueries({ queryKey: ['userBalance'] })
    },
    onError: (error) => {
      toast({
        title: "Error deleting credit award",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  })

  return {
    deleteAward,
    isDeleting
  }
} 