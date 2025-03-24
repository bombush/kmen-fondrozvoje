/**
 * Credit Awards Page
 * Shows all credit awards with filtering and management options
 */
"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { usePaginatedCreditAwards } from "@/hooks/use-credit-awards"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { formatMoney, formatDate } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { CreditAwardCrud } from "@/lib/services/crud/credit-award-crud"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusCircle, Search, Loader2 } from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { CreditAward } from "@/types"
import { useQuery } from "@tanstack/react-query"

const PAGE_SIZE = 2

export default function CreditsPage() {
  const { appUser, isAdmin } = useAuth()
  const [reasonFilter, setReasonFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all") 
  const [monthFilter, setMonthFilter] = useState("all")
  const { data: users } = useUsers()
  
  // Fetch months for filter
  const { data: months = [] } = useQuery({
    queryKey: ['creditAwardMonths'],
    queryFn: async () => {
      const creditAwardCrud = new CreditAwardCrud();
      const months = await creditAwardCrud.getMonthRange();
      return months;
    }
  });
  
  const { 
    data: filteredAwards = [],
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = usePaginatedCreditAwards(reasonFilter, userFilter, monthFilter, PAGE_SIZE)
  const observerTarget = useRef<HTMLDivElement>(null)

  const getUserName = (userId: string) => {
    const user = users?.find(user => user.id === userId)
    return user?.name || userId
  }
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }
    
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  
  const getReasonLabel = (reason: string) => {
    switch(reason) {
      case 'monthly_allocation':
        return 'Monthly Allocation'
      case 'admin_award':
        return 'Admin Award'
      case 'system':
        return 'System'
      case 'refund':
        return 'Refund'
      default:
        return reason
    }
  }
  
  const getReasonBadgeVariant = (reason: string) => {
    switch(reason) {
      case 'monthly_allocation':
        return 'success'
      case 'admin_award':
        return 'default'
      case 'system':
        return 'secondary'
      case 'refund':
        return 'warning'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Credits</h1>
        
        {isAdmin && (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Award Credits
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-4 flex-wrap">
        {/* User filter */}
        <Select
          value={userFilter}
          onValueChange={setUserFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users?.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Reason filter */}
        <Select
          value={reasonFilter}
          onValueChange={setReasonFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="monthly_allocation">Monthly Allocation</SelectItem>
            <SelectItem value="admin_award">Admin Award</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Month filter */}
        <Select
          value={monthFilter}
          onValueChange={setMonthFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(month => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableCaption>
              {filteredAwards.length} credit award{filteredAwards.length !== 1 ? 's' : ''}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAwards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No credit awards found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAwards.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>{getUserName(award.userId)}</TableCell>
                    <TableCell className="font-medium">{formatMoney(award.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getReasonBadgeVariant(award.reason)}>
                        {getReasonLabel(award.reason)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(award.createdAt)}</TableCell>
                    <TableCell>{award.targetMonth || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{award.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Loading indicator for next page */}
          <div 
            ref={observerTarget} 
            className="flex justify-center py-4"
          >
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="text-sm text-muted-foreground mt-8">
        <p>Credits are awarded automatically based on payments or manually by admins.</p>
        <p>Monthly allocations are distributed at the beginning of each month.</p>
      </div>
    </div>
  )
} 