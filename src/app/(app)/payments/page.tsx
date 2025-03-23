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
 * - search filter by all fields
 */
"use client"

import React, { useState } from "react"
import { BankPayment } from "@/types"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Split, GitMerge, GitBranch } from "lucide-react"
import { formatMoney, formatDate, formatDateSql } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { usePayments } from "@/hooks/use-payments"

export default function PaymentsPage() {
  // State for filtering and UI
  const [search, setSearch] = useState("")
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  
  // Fetch all payments and filter on client
  const { data: allPayments, isLoading, error } = usePayments({})
  
  // Helper function to check if a payment is a parent payment
  const isParentPayment = (payment: BankPayment) => {
    if (!allPayments) return false
    return allPayments.some(p => p.isSplitFromId === payment.id)
  }
  
  // Handle payment splitting
  const handleSplitPayment = (payment: BankPayment) => {
    toast.info("Split payment functionality coming soon")
  }
  
  // Filter and sort payments in the frontend
  const filteredAndSortedPayments = React.useMemo(() => {
    if (!allPayments) return []
    
    // Apply filters
    let result = [...allPayments]
    
    // Apply search filter (case insensitive)
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(payment => 
        payment.counterpartyName?.toLowerCase().includes(searchLower) ||
        payment.counterpartyAccountNumber?.toLowerCase().includes(searchLower) ||
        payment.message?.toLowerCase().includes(searchLower) ||
        payment.comment?.toLowerCase().includes(searchLower) ||
        payment.variableSymbol?.toLowerCase().includes(searchLower) ||
        payment.specificSymbol?.toLowerCase().includes(searchLower) ||
        payment.constantSymbol?.toLowerCase().includes(searchLower) ||
        payment.targetMonth?.toLowerCase().includes(searchLower) ||
        formatDateSql(payment.receivedAt)?.toLowerCase().includes(searchLower)
      )
    }
    
    // Sort by received date (newest first)
    return result.sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    )
  }, [allPayments, search])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
      </div>

      {/* Search and filters */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="text-sm font-medium block mb-1">Search</label>
          <input 
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, account number, message..."
            className="w-full px-4 py-2 border border-input bg-background rounded-md"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 text-center text-destructive border rounded-md bg-card">
          Error loading payments. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredAndSortedPayments.length === 0 && (
        <div className="p-6 text-center text-muted-foreground border rounded-md bg-card">
          No payments found matching your filters
        </div>
      )}

      {/* Payments table */}
      {!isLoading && filteredAndSortedPayments.length > 0 && (
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
              {filteredAndSortedPayments.map((payment) => (
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
                    <TableCell className="text-muted-foreground">{formatDateSql(payment.receivedAt)}</TableCell>
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