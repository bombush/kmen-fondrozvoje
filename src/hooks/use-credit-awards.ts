import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CreditAward } from "@/types"
import { CreditAwardCrud } from "@/lib/services/crud/credit-award-crud"
import { CreditWorkflow } from "@/lib/services/workflows/credit-workflow"
import { toast } from "sonner"

const DEFAULT_PAGE_SIZE = 40

/**
 * Hook for fetching paginated credit awards with filtering
 */
export function usePaginatedCreditAwards(
  reasonFilter: string = 'all',
  userFilter: string = 'all',
  monthFilter: string = 'all',
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['creditAwards', reasonFilter, userFilter, monthFilter, pageSize],
    queryFn: async ({ pageParam }) => {
      const creditAwardCrud = new CreditAwardCrud()
      return creditAwardCrud.getPaginatedAwards(reasonFilter, userFilter, monthFilter, pageParam, pageSize)
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < pageSize) return undefined
      return lastPage[lastPage.length - 1]
    },
  })

  const allAwards = data?.pages.flat() || []

  return {
    data: allAwards,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error
  }
}

/**
 * Hook for awarding credits to a user
 */
export function useAwardCredits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      reason,
      targetMonth,
      notes,
      sourceType,
      sourceId
    }: {
      userId: string;
      amount: number;
      reason: CreditAward['reason'];
      targetMonth?: string;
      notes?: string;
      sourceType?: string;
      sourceId?: string;
    }) => {
      const workflow = new CreditWorkflow()
      return workflow.awardCredits({
        userId,
        amount,
        reason,
        targetMonth,
        notes,
        sourceType,
        sourceId
      })
    },
    onSuccess: (data, variables) => {
      toast.success("Credits awarded", {
        description: `Successfully awarded ${variables.amount} credits to the user.`,
      })
      queryClient.invalidateQueries({ queryKey: ['creditAwards'] })
      queryClient.invalidateQueries({ queryKey: ['userBalance'] })
    },
    onError: (error) => {
      toast.error("Error awarding credits", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })
} 