/**
 * Payment matrix page
 * Shows payments in a user/month matrix
 */
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { User, BankPayment } from "@/types"
import { cn, formatMoney } from "@/lib/utils"
import { useUsers } from "@/hooks/use-users"
import { usePayments } from "@/hooks/use-payments"

// Types for the payment matrix
type MatrixMonth = {
  month: string // Format: YYYY-MM
  totalIncome: number
  creditsPerUser: number
  userCredits: Record<string, number>
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
  
  // Calculate matrix data from actual payments
  const matrixData = useMemo(() => {
    if (isLoadingUsers || isLoadingPayments) {
      return { months: [], users: [] };
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
      
      // Create user credits mapping with actual payment amounts
      const userCredits: Record<string, number> = {};
      users.forEach(user => {
        // Get the payments made by this user for this month
        const userPayments = monthPayments.filter(p => p.userId === user.id);
        
        // Sum up the user's actual payments
        const userTotal = userPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Store the actual amount contributed, not the evenly distributed credits
        userCredits[user.id] = userTotal;
      });
      
      return {
        month,
        totalIncome,
        creditsPerUser,
        userCredits
      };
    });
    
    return { months, users };
  }, [users, payments, isLoadingUsers, isLoadingPayments]);

  // Function to handle cell click (for future interaction)
  const handleCellClick = (month: string, userId: string, currentValue: number) => {
    toast.info(`Cell clicked: ${month}, User ID: ${userId}, Value: ${currentValue}`, {
      description: "Editing functionality would be implemented here"
    })
  }

  // Function to format month for display
  const formatMonth = (month: string) => {
    return month // Could enhance with localization if needed
  }

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
                  {matrixData.users.map(user => (
                    <td
                      key={`${month.month}-${user.id}`}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-muted/50",
                        month.userCredits[user.id] ? "" : "text-muted-foreground"
                      )}
                      onClick={() => handleCellClick(month.month, user.id, month.userCredits[user.id] || 0)}
                    >
                      {month.userCredits[user.id] ? (
                        <span className="text-green-600 dark:text-green-400">
                          {formatMoney(month.userCredits[user.id])}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
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