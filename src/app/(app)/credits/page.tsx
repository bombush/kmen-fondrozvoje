/**
 * Credit Awards Page
 * Shows all credit awards with filtering and management options
 */
"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
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

const PAGE_SIZE = 2

export default function CreditsPage() {
  const { appUser, isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [reasonFilter, setReasonFilter] = useState("all")
  const { data: users } = useUsers()
  const observerTarget = useRef<HTMLDivElement>(null)

  const getUserName = (userId: string) => {
    const user = users?.find(user => user.id === userId)
    return user?.name || userId
  }
  
  // Fetch credit awards with infinite scroll
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['creditAwards', reasonFilter],
    queryFn: async ({ pageParam = null }) => {
      const creditAwardCrud = new CreditAwardCrud()
      
      // Base query constraints
      const constraints = [{ field: "deleted", operator: "==", value: false }]
      
      // Add reason filter if not "all"
      if (reasonFilter !== "all") {
        constraints.push({ field: "reason", operator: "==", value: reasonFilter })
      }

      constraints.push({field:"deleted", operator:"==", value:false})
      
      // Get awards with pagination
      const awards = await creditAwardCrud.getWithPagination(
        constraints, 
        PAGE_SIZE, 
        pageParam
      )
      
      return awards
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      // Return the last document as the cursor for the next page
      // If the page has fewer items than PAGE_SIZE, there are no more pages
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1]
    },
  })
  
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
  
  // Flatten all pages of data
  const allAwards = data?.pages.flat() || []
  
  // Filter awards based on search
  const filteredAwards = allAwards.filter(award => {
    const matchesSearch = 
      (award.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      award.sourceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      award.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(award.userId).toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })
  
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
      
      <div className="flex items-center gap-4">
        <div className="relative grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search credit awards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
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