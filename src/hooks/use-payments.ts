import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPaymentsForMonth, updatePayment } from '@/lib/services/payment-service'
import { BankPaymentCrud, SortConfig } from '@/lib/services/crud/bank-crud'
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

// Hook for loading payments with filtering and sorting options
export type PaymentsQueryConfig = {
  month?: string,
  monthReceived?: string,
  userId?: string,
  search?: string,
  sort?: SortConfig
}

export function usePayments(config: PaymentsQueryConfig) {
  const bankPaymentCrud = new BankPaymentCrud()
  return useQuery({
    queryKey: ['payments', config.month, config.monthReceived, config.userId, config.search, config.sort],
    queryFn: () => bankPaymentCrud.getFiltered(
      {
        targetMonth: config.month,
        userId: config.userId,
        // Note: search is handled in the component, not at the DB level
      }, 
      false, // Don't include deleted payments
      config.sort // Pass sort configuration
    )
  })
}

export function useLastPayment() {
  const bankPaymentCrud = new BankPaymentCrud()
  return useQuery({
    queryKey: ['lastPayment'],
    queryFn: () => bankPaymentCrud.getLastPayment()
  })
}