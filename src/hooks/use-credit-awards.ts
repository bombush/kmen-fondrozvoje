import { useInfiniteQuery } from "@tanstack/react-query"
import { CreditAward } from "@/types"
import { CreditAwardCrud } from "@/lib/services/crud/credit-award-crud"

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