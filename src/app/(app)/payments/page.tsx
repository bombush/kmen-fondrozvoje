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

import React, { useState, useMemo } from "react"
import { BankPayment } from "@/types"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Split, GitMerge, GitBranch, CornerDownRight } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePayments } from "@/hooks/use-payments"
import { PaymentSplitDialog } from "@/components/bank/payment-split-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PaymentsPage() {
  // State for filtering and UI
  const [search, setSearch] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<BankPayment | null>(null)
  const [splitDialogOpen, setSplitDialogOpen] = useState(false)
  
  // Fetch all payments and filter on client
  const { data: allPayments, isLoading, error, refetch } = usePayments({})
  
  // Get child payments for a specific parent payment
  const getChildPayments = (parentId: string) => {
    if (!allPayments) return [];
    return allPayments.filter(p => p.isSplitFromId === parentId && !p.deleted);
  };
  
  // Helper function to check if a payment is a parent payment
  const isParentPayment = (payment: BankPayment) => {
    if (!allPayments) return false;
    return allPayments.some(p => p.isSplitFromId === payment.id && !p.deleted);
  };
  
  // Handle payment splitting
  const handleSplitPayment = (payment: BankPayment) => {
    setSelectedPayment(payment);
    setSplitDialogOpen(true);
  };
  
  // Filter out child payments from the main list (we'll show them nested)
  const filteredPayments = useMemo(() => {
    if (!allPayments) return [];
    return allPayments.filter(p => !p.isSplitFromId && !p.deleted);
  }, [allPayments]);
  
  // Filter and sort payments in the frontend
  const filteredAndSortedPayments = useMemo(() => {
    if (!filteredPayments) return [];
    
    // First filter by month if a month filter is set
    let filtered = filteredPayments;
    if (monthFilter && monthFilter !== "all") {
      filtered = filtered.filter(payment => {
        // Check if the parent payment's month matches
        if (payment.targetMonth === monthFilter) return true;
        
        // Check if any child payment's month matches
        const childPayments = getChildPayments(payment.id);
        return childPayments.some(child => child.targetMonth === monthFilter);
      });
    }
    
    // Then filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.counterpartyName?.toLowerCase().includes(searchLower) ||
        payment.counterpartyAccountNumber?.toLowerCase().includes(searchLower) ||
        payment.message?.toLowerCase().includes(searchLower) ||
        payment.variableSymbol?.toLowerCase().includes(searchLower) ||
        payment.specificSymbol?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date (newest first)
    return [...filtered].sort((a, b) => 
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }, [filteredPayments, search, monthFilter, getChildPayments]);
  
  return (
    <div className="container py-10 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80"
          />
          
          <div className="w-full md:w-48">
            <Select
              value={monthFilter}
              onValueChange={setMonthFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {/* Generate last 12 months */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const monthValue = date.toISOString().substring(0, 7); // YYYY-MM format
                  const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <SelectItem key={monthValue} value={monthValue}>
                      {monthLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
        </div>
      ) : error ? (
        <div className="text-red-500">Error loading payments: {error.message}</div>
      ) : filteredAndSortedPayments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No payments found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Amount</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPayments.map((payment) => {
                const childPayments = getChildPayments(payment.id);
                const hasSplits = childPayments.length > 0;
                
                return (
                  <React.Fragment key={payment.id}>
                    {/* Parent payment row */}
                    <TableRow 
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        expandedPaymentId === payment.id && "bg-muted/50"
                      )}
                      onClick={() => setExpandedPaymentId(
                        expandedPaymentId === payment.id ? null : payment.id
                      )}
                    >
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          {formatMoney(payment.amount)}
                          {hasSplits && (
                            <Badge variant="outline" className="ml-2">
                              Split
                            </Badge>
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
                            
                            {/* Child payments section */}
                            {hasSplits && (
                              <div className="mt-4 border-t pt-4">
                                <h3 className="text-sm font-medium mb-3">Split Payments</h3>
                                <div className="space-y-2">
                                  {childPayments.map(child => (
                                    <div key={child.id} className="flex items-center gap-2 p-2 rounded-md bg-background border">
                                      <CornerDownRight size={16} className="text-muted-foreground" />
                                      <div className="font-semibold">{formatMoney(child.amount)}</div>
                                      <div className="text-muted-foreground ml-4">
                                        Month: <span className="font-medium">{child.targetMonth || 'Unassigned'}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-3 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSplitPayment(payment);
                                }}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                                  hasSplits 
                                    ? "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" 
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                              >
                                {hasSplits ? <GitBranch size={16} /> : <Split size={16} />}
                                {hasSplits ? "Edit Split" : "Split Payment"}
                              </button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Split Payment Dialog */}
      {selectedPayment && (
        <PaymentSplitDialog 
          payment={selectedPayment}
          open={splitDialogOpen}
          onOpenChange={setSplitDialogOpen}
          onSplitComplete={() => {
            refetch();
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}