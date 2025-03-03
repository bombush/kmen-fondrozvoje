"use client"

import { BankPayment } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Split } from "lucide-react"

interface PaymentListProps {
  payments: BankPayment[]
  onSplitPayment: (payment: BankPayment) => void
}

export function PaymentList({ payments, onSplitPayment }: PaymentListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Received</TableHead>
          <TableHead>Month</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow 
            key={payment.id}
            className={payment.isVirtualParent ? "opacity-50" : ""}
          >
            <TableCell>{payment.userId}</TableCell>
            <TableCell>{formatMoney(payment.amount)}</TableCell>
            <TableCell>{formatDate(payment.receivedAt)}</TableCell>
            <TableCell>{payment.targetMonth || "Unassigned"}</TableCell>
            <TableCell>
              {!payment.isVirtualParent && !payment.virtualParentId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSplitPayment(payment)}
                >
                  <Split className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 