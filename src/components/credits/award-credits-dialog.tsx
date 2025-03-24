"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { PlusCircle, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/types"
import { CreditWorkflow } from "@/lib/services/workflows/credit-workflow"

interface AwardCreditsDialogProps {
  users: User[]
}

export function AwardCreditsDialog({ users }: AwardCreditsDialogProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("admin_award")
  const [targetMonth, setTargetMonth] = useState("")
  const [notes, setNotes] = useState("")
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const resetForm = () => {
    setUserId("")
    setAmount("")
    setReason("admin_award")
    setTargetMonth("")
    setNotes("")
  }
  
  // Generate current month and previous/next months for the dropdown
  const generateMonthOptions = () => {
    const options = []
    const today = new Date()
    
    // Add 3 previous months, current month, and 3 future months
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const month = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear()
      const value = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      options.push({
        value,
        label: `${month} ${year}`
      })
    }
    
    return options
  }
  
  const monthOptions = generateMonthOptions()
  
  // Mutation for awarding credits
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!userId || !amount) return
      
      const workflow = new CreditWorkflow()
      await workflow.awardCredits({
        userId,
        amount: parseFloat(amount),
        reason: reason as any,
        targetMonth: targetMonth === "null" ? undefined : targetMonth,
        notes: notes || undefined,
        sourceType: "admin",
        sourceId: "manual_award"
      })
    },
    onSuccess: () => {
      toast({
        title: "Credits awarded",
        description: `Successfully awarded ${amount} credits to the user.`,
      })
      queryClient.invalidateQueries({ queryKey: ['creditAwards'] })
      setOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast({
        title: "Error awarding credits",
        description: error.message,
        variant: "destructive"
      })
    }
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive"
      })
      return
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      })
      return
    }
    
    mutate()
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Award Credits
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Award Credits</DialogTitle>
          <DialogDescription>
            Award credits to a user. This will increase their balance.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <Select 
              value={userId} 
              onValueChange={setUserId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select 
              value={reason} 
              onValueChange={setReason}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin_award">Admin Award</SelectItem>
                <SelectItem value="monthly_allocation">Monthly Allocation</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="month">Target Month (Optional)</Label>
            <Select 
              value={targetMonth} 
              onValueChange={setTargetMonth}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No specific month</SelectItem>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information about this award"
              rows={3}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Awarding...
                </>
              ) : (
                "Award Credits"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 