/**
 * Payment matrix page
 * Shows payments in a user/month matrix
 */
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { User, BankPayment } from "@/types"
import { cn, formatMoney, formatDate } from "@/lib/utils"
import { useUsers } from "@/hooks/use-users"
import { usePayments } from "@/hooks/use-payments"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { CornerUpRight } from "lucide-react"

// Types for the payment matrix
type MatrixMonth = {
  month: string // Format: YYYY-MM
  totalIncome: number
  creditsPerUser: number
  userCredits: Record<string, number>
  userPaymentDetails: Record<string, BankPayment[]>
}

type PaymentMatrixData = {
  months: MatrixMonth[]
  users: User[]
}

export default function PaymentMatrixPage() {
  // Fetch actual users
  const { data: users = [], isLoading: isLoadingUsers } = useUsers(true)
  
  // Fetch all payments (we'll filter by month in the component)
  const { data: payments = [], isLoading: isLoadingPayments } = usePayments({})
  
  // Add state to track showing inactive users
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);

  // Filter users based on the toggle state
  const displayUsers = useMemo(() => {
    if (showInactiveUsers) {
      return users;
    } else {
      return users.filter(user => user.isActive);
    }
  }, [users, showInactiveUsers]);

  // Calculate matrix data from actual payments
  const matrixData = useMemo(() => {
    if (isLoadingUsers || isLoadingPayments) {
      return { months: [], users: displayUsers };
    }
    
    // Get unique months from payments
    const monthsSet = new Set<string>();
    payments.forEach(payment => {
      if (payment.targetMonth) {
        monthsSet.add(payment.targetMonth);
      }
    });
    
    // Sort months chronologically
    const sortedMonths = Array.from(monthsSet).sort();
    
    // Calculate the matrix data for each month
    const months: MatrixMonth[] = sortedMonths.map(month => {
      // Get payments for this month
      const monthPayments = payments.filter(p => p.targetMonth === month && !p.deleted);
      
      // Calculate total income for the month
      const totalIncome = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Get active users who contributed this month
      const activeUserIds = new Set<string>();
      monthPayments.forEach(p => {
        if (p.userId) activeUserIds.add(p.userId);
      });
      const activeUsers = Array.from(activeUserIds);
      
      // Calculate credits per active user
      const creditsPerUser = activeUsers.length ? Math.round(totalIncome / activeUsers.length) : 0;
      
      // Create user credits mapping with actual payment amounts AND payment details
      const userCredits: Record<string, number> = {};
      const userPaymentDetails: Record<string, BankPayment[]> = {};
      
      displayUsers.forEach(user => {
        // Get the payments made by this user for this month
        const userPayments = monthPayments.filter(p => p.userId === user.id);
        
        // Sum up the user's actual payments
        const userTotal = userPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Store the actual amount contributed
        userCredits[user.id] = userTotal;
        
        // Store full payment details for tooltip
        userPaymentDetails[user.id] = userPayments;
      });
      
      return {
        month,
        totalIncome,
        creditsPerUser,
        userCredits,
        userPaymentDetails
      };
    });
    
    return { months, users: displayUsers };
  }, [displayUsers, payments, isLoadingUsers, isLoadingPayments]);

  // Add state to track which tooltip is open
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  // Function to handle cell click to toggle tooltip
  const handleCellClick = (month: string, userId: string, currentValue: number) => {
    const tooltipId = `${month}-${userId}`;
    setOpenTooltip(openTooltip === tooltipId ? null : tooltipId);
  }

  // Function to format month for display
  const formatMonth = (month: string) => {
    return month // Could enhance with localization if needed
  }

  // Helper function to find parent payment
  const findParentPayment = (payment: BankPayment) => {
    if (!payment.isSplitFromId) return null;
    return payments.find(p => p.id === payment.isSplitFromId);
  };

  if (isLoadingUsers || isLoadingPayments) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Payment Matrix</h1>
      <p className="text-muted-foreground">
        Credit distribution matrix showing how income is distributed among users by month.
      </p>
      
      {/* Add toggle button for inactive users */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowInactiveUsers(!showInactiveUsers)}
          className="px-3 py-1 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          {showInactiveUsers ? "Hide Inactive Users" : "Show Inactive Users"}
        </button>
        {!showInactiveUsers && users.length > displayUsers.length && (
          <span className="text-xs text-muted-foreground">
            ({users.length - displayUsers.length} inactive users hidden)
          </span>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-b-2 border-b-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Month</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total income</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Credits per user</th>
                {matrixData.users.map(user => (
                  <th key={user.id} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {user.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.months.map(month => (
                <tr key={month.month} className="border-b border-b-muted/20">
                  <td className="px-4 py-3">{formatMonth(month.month)}</td>
                  <td className="px-4 py-3">
                    <span className="text-white-600 dark:text-black-400">
                      {formatMoney(month.totalIncome)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatMoney(month.creditsPerUser)}
                    </span>
                  </td>
                  {matrixData.users.map(user => {
                    const userPayments = month.userPaymentDetails[user.id] || [];
                    const hasPayments = userPayments.length > 0;
                    const tooltipId = `${month.month}-${user.id}`;
                    
                    return (
                      <td
                        key={tooltipId}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-muted/50",
                          hasPayments ? "" : "text-muted-foreground"
                        )}
                      >
                        <Popover open={openTooltip === tooltipId} onOpenChange={(open) => {
                          if (open) {
                            setOpenTooltip(tooltipId);
                          } else {
                            setOpenTooltip(null);
                          }
                        }}>
                          <PopoverTrigger asChild>
                            <span 
                              className={cn(
                                "block w-full", 
                                hasPayments ? "text-green-600 dark:text-green-400" : ""
                      )}
                      onClick={() => handleCellClick(month.month, user.id, month.userCredits[user.id] || 0)}
                    >
                              {hasPayments ? formatMoney(month.userCredits[user.id]) : '—'}
                            </span>
                          </PopoverTrigger>
                          
                          {hasPayments && (
                            <PopoverContent side="right" className="max-w-md p-0 bg-popover text-popover-foreground border border-border">
                              <div className="p-4 space-y-3">
                                <h3 className="font-medium text-sm">Payment Details</h3>
                                
                                {userPayments.map(payment => {
                                  const parentPayment = findParentPayment(payment);
                                  
                                  return (
                                    <div key={payment.id} className="text-xs space-y-1 border-b border-border pb-2 last:border-0">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Received:</span>
                                        <span>{formatDate(payment.receivedAt)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount:</span>
                                        <span className="font-semibold">{formatMoney(payment.amount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Counterparty:</span>
                                        <span>{payment.counterpartyName || 'Not provided'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Account:</span>
                                        <span>{payment.counterpartyAccountNumber || 'Not provided'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Transaction ID:</span>
                                        <span>{payment.bankTransactionId}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Symbols:</span>
                                        <span>
                                          {payment.variableSymbol && `VS: ${payment.variableSymbol}`}
                                          {payment.specificSymbol && `, SS: ${payment.specificSymbol}`}
                                          {payment.constantSymbol && `, CS: ${payment.constantSymbol}`}
                                        </span>
                                      </div>
                                      
                                      {parentPayment && (
                                        <div className="mt-1 pt-1 border-t border-border flex gap-1 items-center text-xs text-muted-foreground">
                                          <CornerUpRight className="h-3 w-3" />
                                          <span>
                                            Part of a larger payment: {formatMoney(parentPayment.amount)}
                        </span>
                                        </div>
                                      )}
                                      
                                      {payment.message && (
                                        <div className="mt-1 pt-1 border-t border-border">
                                          <div className="text-muted-foreground">Message:</div>
                                          <div>{payment.message}</div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          )}
                        </Popover>
                    </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Click on any user credit cell to edit.</p>
        <p>Green values show credit allocations, empty cells are shown in gray.</p>
      </div>
    </div>
  )
}