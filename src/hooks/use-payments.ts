import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPaymentsForMonth, updatePayment } from '@/lib/services/payment-service'
import { BankPaymentCrud } from '@/lib/services/crud/bank-crud'
import { BankPayment } from '@/types'

export function useMonthlyPayments(month: string) {
  return useQuery({
    queryKey: ['payments', month],
    queryFn: () => getPaymentsForMonth(month)
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()
  const bankPaymentCrud = new BankPaymentCrud()

  return useMutation({
    mutationFn: ({id, data}: {id: string, data: BankPayment}) => bankPaymentCrud.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    }
  })
} 

// Hook for loading payments. Possible to filter by assigned to month, month received, user and search query.
// pass in config as a type to be able to pass in optional parameters. Define the type for the config first.
export type PaymentsQueryConfig = {
  month?: string,
  monthReceived?: string,
  userId?: string,
  search?: string
}

export function usePayments(config: PaymentsQueryConfig) {
  const bankPaymentCrud = new BankPaymentCrud()
  return useQuery({
    queryKey: ['payments', config.month, config.monthReceived, config.userId, config.search],
    queryFn: () => bankPaymentCrud.getFiltered(config)
  })
}