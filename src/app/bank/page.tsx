"use client"

import { useState, useEffect } from "react"
import { BankStatement, BankPayment } from "@/types"
import { BankStatementList } from "@/components/bank/bank-statement-list"
import { PaymentList } from "@/components/bank/payment-list"
import { PaymentSplitDialog } from "@/components/bank/payment-split-dialog"
import { getBankService } from "@/lib/services/bank-service"
import { getPaymentsForMonth } from "@/lib/services/payment-service"

export default function BankPage() {
  const [statements, setStatements] = useState<BankStatement[]>([])
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null)
  const [payments, setPayments] = useState<BankPayment[]>([])
  const [splitDialogPayment, setSplitDialogPayment] = useState<BankPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadStatements()
  }, [])

  useEffect(() => {
    if (selectedStatement) {
      loadPayments(selectedStatement.id)
    }
  }, [selectedStatement])

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7)
        const data = await getPaymentsForMonth(currentMonth)
        setPayments(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load payments'))
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  async function loadStatements() {
    setLoading(true)
    try {
      const bankService = getBankService()
      const data = await bankService.getStatements()
      setStatements(data)
    } catch (error) {
      console.error('Failed to load statements:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPayments(statementId: string) {
    setLoading(true)
    try {
      const bankService = getBankService()
      const data = await bankService.getPaymentsForStatement(statementId)
      setPayments(data)
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSplitPayment(payment: BankPayment, splits: Array<{ amount: number; targetMonth: string }>) {
    try {
      const bankService = getBankService()
      await bankService.createVirtualPayments(payment.id, splits)
      if (selectedStatement) {
        await loadPayments(selectedStatement.id)
      }
    } catch (error) {
      console.error('Failed to split payment:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Bank Statements</h2>
        <BankStatementList 
          statements={statements}
          onViewStatement={setSelectedStatement}
        />
      </div>

      {selectedStatement && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Payments</h2>
          <PaymentList
            month={selectedStatement?.month || new Date().toISOString().slice(0, 7)}
          />
        </div>
      )}

      {splitDialogPayment && (
        <PaymentSplitDialog
          payment={splitDialogPayment}
          open={!!splitDialogPayment}
          onOpenChange={(open) => !open && setSplitDialogPayment(null)}
          onSplit={async (splits) => {
            await handleSplitPayment(splitDialogPayment, splits)
            setSplitDialogPayment(null)
          }}
        />
      )}
    </div>
  )
} 