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
import { PlusCircle, Search, Loader2, Trash2 } from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { CreditAward } from "@/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AwardCreditsDialog } from "@/components/credits/award-credits-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useCreditAwardDeletion } from "@/hooks/use-credit-award-deletion"

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
    data: filteredAwards = [] as CreditAward[],
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = usePaginatedCreditAwards(reasonFilter, userFilter, monthFilter, PAGE_SIZE)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Dialog state
  const [awardToDelete, setAwardToDelete] = useState<CreditAward | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { deleteAward, isDeleting } = useCreditAwardDeletion()

  // Dialog handlers
  const handleDeleteClick = (award: CreditAward) => {
    setAwardToDelete(award)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (awardToDelete) {
      deleteAward(awardToDelete.id)
      setDeleteDialogOpen(false)
      setAwardToDelete(null)
    }
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

  const getUserName = useCallback((userId: string | undefined) => {
    if (!userId) return 'Unknown';
    const user = users?.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  }, [users]);

  return (
    <div className="container py-2 space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Credits</h1>
        
        {isAdmin && <AwardCreditsDialog users={users || []} />}
      </div>
      <div className="text-sm text-muted-foreground mt-8 py-6">
        <p>Credits are awarded automatically based on payments or manually by admins.</p>
        <p>Monthly allocations are distributed at the beginning of each month.</p>
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
                <TableHead>Recipient</TableHead>
                <TableHead className="font-medium">Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Awarded By</TableHead>
                {isAdmin && <TableHead className="w-[80px]">Actions</TableHead>}
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
                    <TableCell>{award.sourceId ? getUserName(award.sourceId) : 'System'}</TableCell>
                    <TableCell>
                      {isAdmin && award.reason !== 'monthly_allocation' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(award)}
                          title="Delete award"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
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
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the credit award of {awardToDelete && formatMoney(awardToDelete.amount)} for {awardToDelete && getUserName(awardToDelete.userId)}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 