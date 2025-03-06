import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPaymentsForMonth, updatePayment } from '@/lib/services/payment-service'

export function useMonthlyPayments(month: string) {
  return useQuery({
    queryKey: ['payments', month],
    queryFn: () => getPaymentsForMonth(month)
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    }
  })
} 