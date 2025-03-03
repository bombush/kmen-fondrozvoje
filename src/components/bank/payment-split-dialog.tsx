"use client"

import { useState } from "react"
import { BankPayment } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash } from "lucide-react"

interface PaymentSplitDialogProps {
  payment: BankPayment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSplit: (splits: Array<{ amount: number; targetMonth: string }>) => void
}

export function PaymentSplitDialog({ 
  payment, 
  open, 
  onOpenChange,
  onSplit 
}: PaymentSplitDialogProps) {
  const [splits, setSplits] = useState([{ amount: 0, targetMonth: "" }])
  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0)
  const remaining = payment.amount - totalSplit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            Total Amount: {payment.amount}
            <br />
            Remaining: {remaining}
          </div>

          {splits.map((split, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-1">
                <Label>Amount</Label>
                <Input 
                  type="number"
                  value={split.amount}
                  onChange={(e) => {
                    const newSplits = [...splits]
                    newSplits[index].amount = Number(e.target.value)
                    setSplits(newSplits)
                  }}
                />
              </div>
              <div className="flex-1">
                <Label>Month</Label>
                <Input 
                  type="month"
                  value={split.targetMonth}
                  onChange={(e) => {
                    const newSplits = [...splits]
                    newSplits[index].targetMonth = e.target.value
                    setSplits(newSplits)
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSplits(splits.filter((_, i) => i !== index))
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() => setSplits([...splits, { amount: 0, targetMonth: "" }])}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Split
          </Button>

          <Button 
            className="w-full"
            disabled={remaining !== 0}
            onClick={() => onSplit(splits)}
          >
            Split Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 