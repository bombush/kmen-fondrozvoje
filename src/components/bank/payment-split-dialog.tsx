"use client"

import { useState, useEffect, useMemo } from "react"
import { BankPayment } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash, AlertCircle } from "lucide-react"
import { generateId } from "@/lib/utils"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BankWorkflow, SplitPaymentItem } from "@/lib/services/workflows/bank-workflow"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePayments } from "@/hooks/use-payments"

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = () => {
  const date = new Date();
  return date.toISOString().substring(0, 7);
};

// Helper function to get previous month in YYYY-MM format
const getPreviousMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().substring(0, 7);
};

const getMonthPreviousToMonth = (month: string) => {
  const date = new Date(month);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().substring(0, 7);
};

// Helper function to generate month options for the dropdown
const generateMonthOptions = () => {
  const options = [];
  const today = new Date();
  
  // Add months from 12 months ago to 12 months in the future
  for (let i = -12; i <= 12; i++) {
    const date = new Date(today);
    date.setMonth(today.getMonth() + i);
    
    const monthValue = date.toISOString().substring(0, 7); // YYYY-MM format
    const monthLabel = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    });
    
    options.push({ value: monthValue, label: monthLabel });
  }
  
  return options;
};

interface PaymentSplitDialogProps {
  payment: BankPayment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSplitComplete: () => void
}

export function PaymentSplitDialog({ 
  payment, 
  open, 
  onOpenChange,
  onSplitComplete 
}: PaymentSplitDialogProps) {
  const { currentUser } = useAuth()
  const [splits, setSplits] = useState<SplitPaymentItem[]>([])
  const [originalAmount, setOriginalAmount] = useState(payment.amount)
  const [remaining, setRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Get all payments to find child payments
  const { data: allPayments } = usePayments({})
  
  // Generate month options once
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  
  // Current and previous month
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const defaultMonth = useMemo(() => getPreviousMonth(), []);
  
  // Find existing child payments
  const childPayments = useMemo(() => {
    if (!allPayments) return [];
    return allPayments.filter(p => p.isSplitFromId === payment.id && !p.deleted);
  }, [allPayments, payment.id]);
  
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      
      // Calculate true original amount - for split payments, we need to add up all pieces
      let calculatedOriginalAmount = payment.amount;
      
      // If there are child payments, add their amounts to get the original total
      if (childPayments.length > 0) {
        calculatedOriginalAmount += childPayments.reduce((sum, child) => sum + child.amount, 0);
      }
      
      setOriginalAmount(calculatedOriginalAmount);
      
      // Start with the original payment in the splits
      let initialSplits: SplitPaymentItem[] = [];
      
      // If there are existing child payments
      if (childPayments.length > 0) {
        // Add the original payment (if it has non-zero amount)
        if (payment.amount > 0) {
          initialSplits.push({
            id: payment.id,
            amount: payment.amount,
            targetMonth: payment.targetMonth || currentMonth
          });
        }
        
        // Add all child payments
        childPayments
        .toSorted((a,b)=>//sort by targetMonth
          -1*(a.targetMonth || '').localeCompare(b.targetMonth || '')
        )
        .forEach(child => {
          initialSplits.push({
            id: child.id,
            amount: child.amount,
            targetMonth: child.targetMonth || defaultMonth
          });
        });
      } else {
        // For unsplit payments, show a single row with the full amount
        initialSplits = [{
          id: payment.id,
          amount: payment.amount,
          targetMonth: payment.targetMonth || currentMonth
        }];
      }
      
      setSplits(initialSplits);
      
      // Calculate remaining amount
      const totalAllocated = initialSplits.reduce((sum, split) => sum + split.amount, 0);
      setRemaining(calculatedOriginalAmount - totalAllocated);
      
      setError("");
      setIsLoading(false);
    }
  }, [open, payment, childPayments, currentMonth, defaultMonth]);
  
  // Recalculate remaining whenever splits change
  useEffect(() => {
    const totalAllocated = splits.reduce((sum, split) => sum + split.amount, 0);
    setRemaining(originalAmount - totalAllocated);
  }, [splits, originalAmount]);

  const handleSplit = async () => {
    try {
      // Validate inputs
      if (remaining !== 0) {
        setError("The total allocated amount must equal the original payment amount");
        return;
      }
      
      // Validate that all splits have a target month
      if (splits.some(split => !split.targetMonth)) {
        setError("All splits must have a target month");
        return;
      }
      
      setIsSubmitting(true);
      setError("");
      
      const bankWorkflow = new BankWorkflow();
      
      // Filter out the original payment from the splits array
      const childSplits = splits.filter(split => split.id !== payment.id);
      
      // Find the original payment in the splits array
      const originalSplit = splits.find(split => split.id === payment.id);
      
      // Handle the case where the original payment might have been removed
      if (!originalSplit && splits.length > 0) {
        // If the original was fully split, use an empty array for splits
        await bankWorkflow.splitPayment(
          payment.id,
          childSplits,
          currentUser?.uid || 'unknown'
        );
      } else if (originalSplit) {
        // If the original payment still has allocation, adjust the splits
        // Set the amount for the original payment
        await bankWorkflow.adjustPayment(
          payment.id, 
          {
            amount: originalSplit.amount,
            targetMonth: originalSplit.targetMonth
          },
          childSplits,
          currentUser?.uid || 'unknown'
        );
      }
      
      toast.success("Payment allocation updated successfully");
      onOpenChange(false);
      onSplitComplete();
    } catch (error) {
      console.error("Error splitting payment:", error);
      setError(error instanceof Error ? error.message : "An error occurred while splitting the payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSplitRow = () => {
    setSplits([...splits, {
      id: generateId(),
      amount: 0,
      targetMonth: getMonthPreviousToMonth(splits[splits.length - 1].targetMonth)
    }]);
  };

  const removeSplit = (index: number) => {
    // Don't allow removing if it's the last split or if it's the original payment
    if (splits.length <= 1 || splits[index].id === payment.id) return;
    
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplitAmount = (index: number, amount: number) => {
    setSplits(splits.map((split, i) => 
      i === index ? { ...split, amount } : split
    ));
  };

  const updateSplitMonth = (index: number, targetMonth: string) => {
    setSplits(splits.map((split, i) => 
      i === index ? { ...split, targetMonth } : split
    ));
  };

  const autoDistributeAmounts = () => {
    if (splits.length === 0) return;
    
    const amountPerSplit = Math.floor(originalAmount / splits.length);
    const remainder = originalAmount - (amountPerSplit * splits.length);
    
    const newSplits = splits.map((split, index) => ({
      ...split,
      amount: amountPerSplit + (index === 0 ? remainder : 0)
    }));
    
    setSplits(newSplits);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {childPayments.length > 0 ? "Edit Payment Allocation" : "Split Payment"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Original Amount</p>
              <p className="text-lg font-semibold">{originalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-lg font-semibold ${remaining !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                {remaining.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
          </div>
          
          {childPayments.length > 0 && (
            <Alert>
              <AlertDescription>
                This payment has already been split. You are editing how the payment is allocated across months.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            {splits.map((split, index) => (
              <div key={split.id} className="flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor={`amount-${index}`}>Amount</Label>
                  <Input 
                    id={`amount-${index}`}
                    type="number"
                    value={split.amount}
                    onChange={(e) => updateSplitAmount(index, Number(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`month-${index}`}>Month</Label>
                  <Select
                    value={split.targetMonth}
                    onValueChange={(value) => updateSplitMonth(index, value)}
                  >
                    <SelectTrigger id={`month-${index}`}>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSplit(index)}
                  disabled={splits.length <= 1 || split.id === payment.id}
                  title={split.id === payment.id ? "Cannot remove original payment" : "Remove split"}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={addSplitRow}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Split
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={autoDistributeAmounts}
            >
              Auto Distribute
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSplit}
            disabled={remaining !== 0 || isSubmitting}
          >
            {childPayments.length > 0 ? "Update Allocation" : "Split Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 