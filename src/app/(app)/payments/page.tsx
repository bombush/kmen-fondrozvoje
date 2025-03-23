/**
 * Payment list page
 * Shows all payments with search and filters
 * 
 * Each payment is a BankPayment
 * Payment list is a list of collapsible headers
 * 
 * Payment list item (collapsed header):
 * - Amount
 * - Counterparty name
 * - Counterparty account number
 * - Target month
 * - Received at
 * 
 * Payment list item (expanded content)
 * - Message
 * - Comment
 * - variable symbol
 * - specific symbol
 * - constant symbol
 * - bank transaction id
 * 
 * Functionality:
 * - button for splitting payment to multiple payments
 * - sort by month
 * - search filter by all fields
 */
"use client"

import React, { useState } from "react"
import { BankPayment } from "@/types"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Split, GitMerge, GitBranch } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { usePayments } from "@/hooks/use-payments"

// Mock payment data (at least 10 payments)
const mockPayments: BankPayment[] = [
  {
    id: "pay-001",
    statementId: "stmt-2025-03",
    userId: "user-001",
    amount: 1500,
    variableSymbol: "123456",
    specificSymbol: "789012",
    constantSymbol: "0308",
    bankTransactionId: "tr-12345",
    counterpartyAccountNumber: "123456789/0300",
    counterpartyName: "Jan Novák",
    receivedAt: "2025-03-01T10:30:00Z",
    message: "Členský příspěvek - Březen 2025",
    comment: "",
    targetMonth: "2025-03",
    createdAt: "2025-03-01T10:30:00Z",
    updatedAt: "2025-03-01T10:30:00Z"
  },
  {
    id: "pay-002",
    statementId: "stmt-2025-03",
    userId: "user-002",
    amount: 2000,
    variableSymbol: "223456",
    specificSymbol: "",
    constantSymbol: "0308",
    bankTransactionId: "tr-12346",
    counterpartyAccountNumber: "987654321/0800",
    counterpartyName: "Eva Svobodová",
    receivedAt: "2025-03-02T09:15:00Z",
    message: "Fond rozvoje - Příspěvek březen",
    comment: "",
    targetMonth: "2025-03",
    createdAt: "2025-03-02T09:15:00Z",
    updatedAt: "2025-03-02T09:15:00Z"
  },
  {
    id: "pay-003",
    statementId: "stmt-2025-03",
    userId: "user-003",
    amount: 3000,
    variableSymbol: "323456",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tr-12347",
    counterpartyAccountNumber: "111222333/0100",
    counterpartyName: "Petr Novotný",
    receivedAt: "2025-03-03T14:45:00Z",
    message: "Příspěvek na projekt XYZ",
    comment: "Dodatečná platba",
    targetMonth: "2025-03",
    createdAt: "2025-03-03T14:45:00Z",
    updatedAt: "2025-03-03T14:45:00Z"
  },
  {
    id: "pay-004",
    statementId: "stmt-2025-02",
    userId: "user-004",
    amount: 1000,
    variableSymbol: "423456",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tr-12348",
    counterpartyAccountNumber: "444555666/0300",
    counterpartyName: "Lucie Dvořáková",
    receivedAt: "2025-02-25T11:20:00Z",
    message: "Členské příspěvky únor",
    comment: "",
    targetMonth: "2025-02",
    createdAt: "2025-02-25T11:20:00Z",
    updatedAt: "2025-02-25T11:20:00Z"
  },
  {
    id: "pay-005",
    statementId: "stmt-2025-02",
    userId: "user-005",
    amount: 5000,
    variableSymbol: "523456",
    specificSymbol: "123456",
    constantSymbol: "0308",
    bankTransactionId: "tr-12349",
    counterpartyAccountNumber: "777888999/0800",
    counterpartyName: "Martin Procházka",
    receivedAt: "2025-02-28T16:30:00Z",
    message: "Sponzorský dar - projekt ABC",
    comment: "Určeno pro konkrétní projekt",
    targetMonth: "2025-02",
    createdAt: "2025-02-28T16:30:00Z",
    updatedAt: "2025-02-28T16:30:00Z"
  },
  // This payment is a parent payment that has been split into two payments below
  {
    id: "pay-006",
    statementId: "stmt-2025-01",
    userId: "user-006",
    amount: 2500,
    variableSymbol: "623456",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tr-12350",
    counterpartyAccountNumber: "123987456/0100",
    counterpartyName: "Jana Horáková",
    receivedAt: "2025-01-15T10:00:00Z",
    message: "Příspěvek leden 2025",
    comment: "",
    targetMonth: "2025-01",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z"
  },
  // Split payment from pay-006
  {
    id: "pay-006-split-1",
    statementId: "stmt-2025-01",
    userId: "user-006",
    amount: 1500,
    variableSymbol: "623456",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tr-12350",
    counterpartyAccountNumber: "123987456/0100",
    counterpartyName: "Jana Horáková",
    receivedAt: "2025-01-15T10:00:00Z",
    message: "Příspěvek leden 2025 - část 1",
    comment: "Split část 1",
    isSplitFromId: "pay-006",
    targetMonth: "2025-01",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z"
  },
  // Split payment from pay-006
  {
    id: "pay-006-split-2",
    statementId: "stmt-2025-01",
    userId: "user-006",
    amount: 1000,
    variableSymbol: "623456",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tr-12350",
    counterpartyAccountNumber: "123987456/0100",
    counterpartyName: "Jana Horáková",
    receivedAt: "2025-01-15T10:00:00Z",
    message: "Příspěvek leden 2025 - část 2",
    comment: "Split část 2",
    isSplitFromId: "pay-006",
    targetMonth: "2025-01",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z"
  },
  {
    id: "pay-007",
    statementId: "stmt-2025-01",
    userId: "user-001",
    amount: 1500,
    variableSymbol: "123456",
    specificSymbol: "",
    constantSymbol: "0308",
    bankTransactionId: "tr-12351",
    counterpartyAccountNumber: "123456789/0300",
    counterpartyName: "Jan Novák",
    receivedAt: "2025-01-10T09:30:00Z",
    message: "Členský příspěvek - Leden 2025",
    comment: "",
    targetMonth: "2025-01",
    createdAt: "2025-01-10T09:30:00Z",
    updatedAt: "2025-01-10T09:30:00Z"
  },
  // This payment will be a parent to the split below
  {
    id: "pay-008",
    statementId: "stmt-2025-03",
    userId: "user-007",
    amount: 10000,
    variableSymbol: "723456",
    specificSymbol: "999888",
    constantSymbol: "0558",
    bankTransactionId: "tr-12352",
    counterpartyAccountNumber: "555666777/0800",
    counterpartyName: "Karel Černý",
    receivedAt: "2025-03-05T13:15:00Z",
    message: "Velký sponzorský dar",
    comment: "Určeno pro fond rozvoje",
    targetMonth: "2025-03",
    createdAt: "2025-03-05T13:15:00Z",
    updatedAt: "2025-03-05T13:15:00Z"
  },
  // Split payment from pay-008
  {
    id: "pay-008-split-1",
    statementId: "stmt-2025-03",
    userId: "user-007",
    amount: 6000,
    variableSymbol: "723456",
    specificSymbol: "999888",
    constantSymbol: "0558",
    bankTransactionId: "tr-12352",
    counterpartyAccountNumber: "555666777/0800",
    counterpartyName: "Karel Černý",
    receivedAt: "2025-03-05T13:15:00Z",
    message: "Velký sponzorský dar - část 1",
    comment: "Určeno pro fond rozvoje - projektová část",
    isSplitFromId: "pay-008",
    targetMonth: "2025-03",
    createdAt: "2025-03-05T13:15:00Z",
    updatedAt: "2025-03-05T13:15:00Z"
  },
  // Split payment from pay-008
  {
    id: "pay-008-split-2",
    statementId: "stmt-2025-03",
    userId: "user-007",
    amount: 4000,
    variableSymbol: "723456",
    specificSymbol: "999888",
    constantSymbol: "0558",
    bankTransactionId: "tr-12352",
    counterpartyAccountNumber: "555666777/0800",
    counterpartyName: "Karel Černý",
    receivedAt: "2025-03-05T13:15:00Z",
    message: "Velký sponzorský dar - část 2",
    comment: "Určeno pro fond rozvoje - provozní část",
    isSplitFromId: "pay-008",
    targetMonth: "2025-03",
    createdAt: "2025-03-05T13:15:00Z",
    updatedAt: "2025-03-05T13:15:00Z"
  },
  {
    id: "pay-009",
    statementId: "stmt-2025-03",
    userId: "user-008",
    amount: 1750,
    variableSymbol: "823456",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tr-12353",
    counterpartyAccountNumber: "999888777/0300",
    counterpartyName: "Tereza Veselá",
    receivedAt: "2025-03-04T10:45:00Z",
    message: "Příspěvek březen + drobný dar",
    comment: "",
    targetMonth: "2025-03",
    createdAt: "2025-03-04T10:45:00Z",
    updatedAt: "2025-03-04T10:45:00Z"
  },
  {
    id: "pay-010",
    statementId: "stmt-2025-02",
    userId: "user-009",
    amount: 1200,
    variableSymbol: "923456",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tr-12354",
    counterpartyAccountNumber: "111222333/0800",
    counterpartyName: "Radek Kučera",
    receivedAt: "2025-02-20T14:00:00Z",
    message: "Platba únor 2025",
    comment: "Opožděná platba",
    targetMonth: "2025-02",
    createdAt: "2025-02-20T14:00:00Z",
    updatedAt: "2025-02-20T14:00:00Z"
  },
  {
    id: "pay-011",
    statementId: "stmt-2025-01",
    userId: "user-010",
    amount: 3500,
    variableSymbol: "103456",
    specificSymbol: "505050",
    constantSymbol: "0308",
    bankTransactionId: "tr-12355",
    counterpartyAccountNumber: "444555666/0100",
    counterpartyName: "Markéta Pokorná",
    receivedAt: "2025-01-28T11:30:00Z",
    message: "Příspěvek leden + fond rozvoje",
    comment: "Část pro fond rozvoje",
    targetMonth: "2025-01",
    createdAt: "2025-01-28T11:30:00Z",
    updatedAt: "2025-01-28T11:30:00Z"
  }
];

// Helper function to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ');
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("")
  const [monthFilter, setMonthFilter] = useState<string>("")
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  const { data: payments, isLoading, error } = usePayments({})

  // Handle payment split action
  const handleSplitPayment = (payment: BankPayment) => {
    toast.info(`Split payment functionality would open a modal for payment ID: ${payment.id}`, {
      description: "This functionality is not yet implemented"
    });
  }

  // Helper function to check if a payment is a parent payment (has children splits)
  const isParentPayment = (payment: BankPayment) => {
    return mockPayments.some(p => p.isSplitFromId === payment.id);
  }

  // Filter payments based on search and month filter
  const filteredPayments = mockPayments.filter(payment => {
    const searchLower = search.toLowerCase();
    const matchesSearch = search === '' || 
      payment.counterpartyName.toLowerCase().includes(searchLower) ||
      payment.counterpartyAccountNumber.toLowerCase().includes(searchLower) ||
      payment.message.toLowerCase().includes(searchLower) ||
      payment.comment.toLowerCase().includes(searchLower) ||
      payment.variableSymbol.toLowerCase().includes(searchLower) ||
      payment.specificSymbol.toLowerCase().includes(searchLower) ||
      payment.constantSymbol.toLowerCase().includes(searchLower) ||
      payment.bankTransactionId.toLowerCase().includes(searchLower);
    
    const matchesMonth = monthFilter === '' || payment.targetMonth === monthFilter;
    
    return matchesSearch && matchesMonth;
  });

  // Sort payments by receivedAt date (newest first)
  const sortedPayments = [...filteredPayments].sort((a, b) => 
    new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Payments</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input 
            type="search"
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-input bg-background rounded-md"
          />
        </div>
        <div>
          <input 
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full px-4 py-2 border border-input bg-background rounded-md"
          />
        </div>
      </div>

      {sortedPayments.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground border rounded-md bg-card">
          No payments found matching your filters
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[16%]">Amount</TableHead>
                <TableHead className="w-[22%]">Counterparty Name</TableHead>
                <TableHead className="w-[22%]">Account Number</TableHead>
                <TableHead className="w-[16%]">Target Month</TableHead>
                <TableHead className="w-[16%]">Received At</TableHead>
                <TableHead className="w-[8%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) => (
                <React.Fragment key={payment.id}>
                  {/* Payment row (collapsible header) */}
                  <TableRow 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedPaymentId(expandedPaymentId === payment.id ? null : payment.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {payment.isSplitFromId && (
                          <GitBranch size={16} className="text-blue-500" aria-label="Split from another payment" />
                        )}
                        {isParentPayment(payment) && (
                          <GitMerge size={16} className="text-purple-500" aria-label="Parent to split payments" />
                        )}
                        {payment.amount > 0 ? (
                          <span className="text-green-600 dark:text-green-400">+{formatMoney(payment.amount)}</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">{formatMoney(payment.amount)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="truncate">{payment.counterpartyName}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.counterpartyAccountNumber}</TableCell>
                    <TableCell>{payment.targetMonth || 'Unassigned'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(payment.receivedAt)}</TableCell>
                    <TableCell className="text-right">
                      {expandedPaymentId === payment.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </TableCell>
                  </TableRow>

                  {/* Expanded content row */}
                  {expandedPaymentId === payment.id && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={6} className="p-0">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Message</h3>
                              <p>{payment.message || 'No message'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Comment</h3>
                              <p>{payment.comment || 'No comment'}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Variable Symbol</h3>
                              <p>{payment.variableSymbol || 'Not provided'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Specific Symbol</h3>
                              <p>{payment.specificSymbol || 'Not provided'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Constant Symbol</h3>
                              <p>{payment.constantSymbol || 'Not provided'}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Bank Transaction ID</h3>
                            <p>{payment.bankTransactionId}</p>
                          </div>
                          
                          <div className="pt-3 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSplitPayment(payment);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                            >
                              <Split size={16} />
                              Split Payment
                            </button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}