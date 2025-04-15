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
import { ChevronDown, ChevronUp, Split, GitMerge, GitBranch, CornerDownRight, EyeOff, Eye, ArrowUpDown, CornerUpRight, UserCircle2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePayments, PaymentsQueryConfig, useUpdatePayment } from "@/hooks/use-payments"
import { SortConfig } from "@/lib/services/crud/bank-crud"
import { PaymentSplitDialog } from "@/components/bank/payment-split-dialog"
import { Input } from "@/components/ui/input"
import { useUsers } from "@/hooks/use-users"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UpdatePaymentsButton } from "@/components/payments/update-payments-button"
import { useAuth } from "@/contexts/auth-context"

export default function PaymentsPage() {
  const { isAdmin } = useAuth()
  // State for filtering and UI
  const [search, setSearch] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<BankPayment | null>(null)
  const [splitDialogOpen, setSplitDialogOpen] = useState(false)
  const [showChildPayments, setShowChildPayments] = useState(true)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'receivedAt',
    direction: 'desc'
  })
  const [hoveredPaymentId, setHoveredPaymentId] = useState<string | null>(null)
  
  // Create query config
  const queryConfig: PaymentsQueryConfig = useMemo(() => ({
    month: monthFilter !== 'all' ? monthFilter : undefined,
    sort: sortConfig
  }), [monthFilter, sortConfig])
  
  // Fetch all payments with sorting
  const { data: allPayments, isLoading, error, refetch } = usePayments(queryConfig)
  
  // Get users for dropdown
  const { data: users = [] } = useUsers(true)
  
  // Update payment mutation
  const updatePaymentMutation = useUpdatePayment()
  
  // Function to handle sorting
  const handleSort = (field: keyof BankPayment) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }
  
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
  
  // Filter payments based on search and child payment visibility
  const filteredPayments = useMemo(() => {
    if (!allPayments) return [];
    
    return allPayments
      .filter(payment => {
        // Filter out deleted payments (though our API should already handle this)
        if (payment.deleted) return false;
        
        // Filter out child payments if toggle is off
        if (!showChildPayments && payment.isSplitFromId) return false;
        
        // Filter by search term
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            payment.counterpartyName?.toLowerCase().includes(searchLower) ||
            payment.message?.toLowerCase().includes(searchLower) ||
            payment.comment?.toLowerCase().includes(searchLower) ||
            payment.specificSymbol?.toLowerCase().includes(searchLower) ||
            payment.variableSymbol?.toLowerCase().includes(searchLower) ||
            payment.constantSymbol?.toLowerCase().includes(searchLower) ||
            formatMoney(payment.amount).toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      });
  }, [allPayments, search, showChildPayments]);

  // Sort indicator component
  const SortIndicator = ({ field }: { field: keyof BankPayment }) => {
    if (sortConfig.field !== field) return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="ml-1" />
      : <ChevronDown size={14} className="ml-1" />;
  };
  
  // Enhance the isRelatedPayment function to identify the specific relationship type
  const getRelationshipType = (payment: BankPayment) => {
    if (!hoveredPaymentId || !allPayments) return null;
    
    // Skip if this is the hovered payment itself
    if (payment.id === hoveredPaymentId) return "self";
    
    const hoveredPayment = allPayments.find(p => p.id === hoveredPaymentId);
    if (!hoveredPayment) return null;
    
    // This payment is the parent of the hovered payment
    if (payment.id === hoveredPayment.isSplitFromId) return "parent";
    
    // This payment is a child of the hovered payment
    if (payment.isSplitFromId === hoveredPaymentId) return "child";
    
    // This payment is a sibling of the hovered payment (shares same parent)
    if (hoveredPayment.isSplitFromId && 
        payment.isSplitFromId === hoveredPayment.isSplitFromId) return "sibling";
    
    return null;
  };
  
  // Handle user assignment change
  const handleUserChange = async (paymentId: string, userId: string) => {
    try {
      const paymentToUpdate = allPayments.find(p => p.id === paymentId)
      if (!paymentToUpdate) return
      
      // If "unassigned" is selected, set userId to null
      const updatedPayment = {
        ...paymentToUpdate,
        userId: userId === "unassigned" ? null : userId
      }
      
      await updatePaymentMutation.mutateAsync({
        id: paymentId,
        data: updatedPayment
      })
      
      toast.success("User assignment updated", {
        description: userId === "unassigned" 
          ? "Payment is now unassigned"
          : `Payment assigned to ${getUserNameById(userId)}`
      })
      
      // Refresh the data
      refetch()
    } catch (error) {
      toast.error("Failed to update user assignment", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }
  
  // Get user name by ID
  const getUserNameById = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : "Not assigned"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payments</h1>
        <UpdatePaymentsButton />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-64">
          <label className="text-sm font-medium block mb-2">Search</label>
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium block mb-2">Month</label>
          <Select
            value={monthFilter}
            onValueChange={setMonthFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="2025-01">January 2025</SelectItem>
              <SelectItem value="2025-02">February 2025</SelectItem>
              <SelectItem value="2025-03">March 2025</SelectItem>
              <SelectItem value="2025-04">April 2025</SelectItem>
              <SelectItem value="2025-05">May 2025</SelectItem>
              <SelectItem value="2025-06">June 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setShowChildPayments(!showChildPayments)}
        >
          {showChildPayments ? (
            <>
              <EyeOff size={16} />
              Hide Split Payments
            </>
          ) : (
            <>
              <Eye size={16} />
              Show Split Payments
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : error ? (
        <div className="p-4 border rounded-md bg-red-50 text-red-700">
          Error loading payments. Please try again.
        </div>
      ) : (
        <div className="w-full overflow-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>
                  <button 
                    className="flex items-center hover:underline font-medium"
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                    <SortIndicator field="amount" />
                  </button>
                </TableHead>
                <TableHead>
                  <button 
                    className="flex items-center hover:underline font-medium"
                    onClick={() => handleSort('counterpartyName')}
                  >
                    Counterparty
                    <SortIndicator field="counterpartyName" />
                  </button>
                </TableHead>
                <TableHead>
                  Assigned to
                </TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>
                  <button 
                    className="flex items-center hover:underline font-medium"
                    onClick={() => handleSort('targetMonth')}
                  >
                    Month
                    <SortIndicator field="targetMonth" />
                  </button>
                </TableHead>
                <TableHead>
                  <button 
                    className="flex items-center hover:underline font-medium"
                    onClick={() => handleSort('receivedAt')}
                  >
                    Received
                    <SortIndicator field="receivedAt" />
                  </button>
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
                  const isParent = isParentPayment(payment);
                  const isChild = !!payment.isSplitFromId;
                  const childPayments = isParent ? getChildPayments(payment.id) : [];
                  const hasSplits = childPayments.length > 0;
                  
                  return (
                <React.Fragment key={payment.id}>
                  <TableRow 
                        className={cn(
                          "cursor-pointer transition-colors",
                          isParentPayment(payment) && !expandedPaymentId ? "border-l-2 border-l-primary" : "",
                          payment.isSplitFromId ? "border-l-2 border-l-orange-500" : "",
                          {
                            "outline outline-2 outline-green-500": getRelationshipType(payment) === "parent",
                            "outline outline-2 outline-blue-500": getRelationshipType(payment) === "child",
                            "outline outline-1 outline-gray-300 dark:outline-gray-700": getRelationshipType(payment) === "sibling",
                            "bg-muted/30": getRelationshipType(payment) === "self",
                          }
                        )}
                        onClick={() => {
                          setExpandedPaymentId(expandedPaymentId === payment.id ? null : payment.id)
                        }}
                        onMouseEnter={() => setHoveredPaymentId(payment.id)}
                        onMouseLeave={() => setHoveredPaymentId(null)}
                      >
                        <TableCell className="text-center">
                          {isParent ? (
                            <GitBranch size={18} className="text-green-600" />
                          ) : isChild ? (
                            <CornerDownRight size={18} className="text-blue-500" />
                          ) : (
                            <div className="w-[18px] h-[18px]" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatMoney(payment.amount)}
                    </TableCell>
                    <TableCell className="truncate">{payment.counterpartyName}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.userId ? getUserNameById(payment.userId) : '-'}</TableCell>
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
                    <TableCell colSpan={7} className="p-0">
                  <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Counterparty</h3>
                            <p>{payment.counterpartyName || 'Not provided'}</p>
                            <p className="text-xs text-muted-foreground">{payment.counterpartyAccountNumber || 'No account number'}</p>
                          </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Message</h3>
                        <p>{payment.message || 'No message'}</p>
                      </div>
                    </div>
                        
                        {/* Parent payment section - show when this is a child payment */}
                        {payment.isSplitFromId && (
                          <div className="mt-4 border-t pt-4">
                            <h3 className="text-sm font-medium mb-3">Is child payment of</h3>
                            {allPayments && (() => {
                              const parentPayment = allPayments.find(p => p.id === payment.isSplitFromId);
                              if (!parentPayment) return <p className="text-sm text-muted-foreground">Parent payment not found</p>;
                              
                              return (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-background border">
                                  <CornerUpRight size={16} className="text-muted-foreground" />
                                  <div className="font-semibold">{formatMoney(parentPayment.amount)}</div>
                                  <div className="text-muted-foreground ml-4">
                                    Received: <span className="font-medium">{formatDate(parentPayment.receivedAt)}</span>
                                  </div>
                                  <button 
                                    className="ml-auto text-xs text-primary hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedPaymentId(parentPayment.id);
                                    }}
                                  >
                                    View parent
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                    
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Bank Transaction ID</h3>
                        <p>{payment.bankTransactionId}</p>
                      </div>
                      <div>
                                <h3 className="text-sm font-medium text-muted-foreground">User Assignment</h3>
                                <div className="flex items-center gap-2">
                                  <UserCircle2 className="h-5 w-5 text-primary" />
                                  <Select
                                    value={payment.userId || "unassigned"}
                                    onValueChange={(value) => handleUserChange(payment.id, value)}
                                    disabled={!isAdmin}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select user">
                                        {payment.userId ? getUserNameById(payment.userId) : "Not assigned"}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unassigned">Not assigned</SelectItem>
                                      {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                          {user.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                          </div>
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
                        
                        {!payment.isSplitFromId && (
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
                        )}
                  </div>
                </TableCell>
              </TableRow>
                  )}
                </React.Fragment>
                  );
                })
              )}
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