"use client"

import { JSX } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, CheckCircle2, Copy, ClipboardCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDate } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import React from "react"

import { BankWorkflow } from "@/lib/services/workflows/bank-workflow"

const bankWorkflow = new BankWorkflow()

function PrettyJSON({ data }: { data: any }) {
  const processValue = (value: any): any => {
    if (typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value).toLocaleString();
    }
    
    if (typeof value === 'number' && 
        (data.some((item: any) => item.amount === value || item.originalAmount === value))) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'CZK',
      }).format(value);
    }
    
    return value;
  };

  const renderJson = (obj: any, indent: number = 0): JSX.Element => {
    if (Array.isArray(obj)) {
      return (
        <div className="pl-2">
          [
          {obj.map((item, index) => (
            <React.Fragment key={index}>
              <div className="ml-2">
                {renderJson(item, indent + 1)}
                {index < obj.length - 1 ? "," : ""}
              </div>
            </React.Fragment>
          ))}
          <div>]</div>
        </div>
      );
    } else if (obj !== null && typeof obj === 'object') {
      return (
        <div className="pl-2">
          {"{"}
          {Object.entries(obj).map(([key, value], index, array) => (
            <div key={key} className="ml-2 flex flex-wrap">
              <span className="text-blue-500 dark:text-blue-400 whitespace-nowrap">"{key}"</span>
              <span className="mx-1">:</span>
              <span className="flex-1 min-w-0 break-all">
                {renderPrimitive(value)}
                {index < array.length - 1 ? "," : ""}
              </span>
            </div>
          ))}
          <div>{"}"}</div>
        </div>
      );
    } else {
      return renderPrimitive(obj);
    }
  };

  const renderPrimitive = (value: any): JSX.Element => {
    const processed = processValue(value);
    
    if (processed === null) return <span className="text-gray-500">null</span>;
    if (typeof processed === 'undefined') return <span className="text-gray-500">undefined</span>;
    if (typeof processed === 'boolean') 
      return <span className="text-purple-500 dark:text-purple-400">{processed.toString()}</span>;
    if (typeof processed === 'number') 
      return <span className="text-green-600 dark:text-green-400">{processed}</span>;
    if (typeof processed === 'string') {
      if (processed !== value) {
        return <span className="text-green-600 dark:text-green-400 break-all">"{processed}"</span>;
      }
      return <span className="text-amber-600 dark:text-amber-400 break-all">"{processed}"</span>;
    }
    
    return renderJson(processed, 1);
  };

  return (
    <div className="font-mono text-xs overflow-x-auto">
      {renderJson(data)}
    </div>
  );
}

export function UpdatePaymentsButton() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; data?: any; paymentsProcessed?: number } | null>(null)
  const [isDataOpen, setIsDataOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  
  
  // The date of the last payment to fetch from
  // This would typically come from your database, but for now we'll use a static date
  //const lastPaymentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  // get last payment date as the date of last payment received
  const lastPaymentDate = await b

  const handleUpdatePayments = async () => {
    setOpen(true)
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setIsCopied(false)
    
    try {
      // Format the date as YYYY-MM-DD
      // log date as ISO string to console
      console.log(lastPaymentDate)
      console.log("Last payment date:", lastPaymentDate.toISOString())
      
      // Call the API to fetch bank statement
      const response = await fetch(`/api/fetch-bank-statement?lastDate=${lastPaymentDate.toISOString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch bank statement')
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch bank statement')
      }
      
      const result = await bankWorkflow.loadPaymentsFromBankStatementAndUpdateCreditAllocation(data.data)
      
      // Success! 
      setSuccess({
        message: data.message || "Successfully fetched bank statement",
        data: data.data,
        paymentsProcessed: result.paymentsProcessed
      })
    } catch (err) {
      console.error("Error updating payments:", err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const copyToClipboard = () => {
    if (success?.data) {
      navigator.clipboard.writeText(JSON.stringify(success.data, null, 2))
        .then(() => {
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        })
        .catch(err => console.error('Failed to copy: ', err))
    }
  }
  
  return (
    <>
      <Button 
        onClick={handleUpdatePayments}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Update Payments
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isLoading ? 'Fetching Bank Statement...' : 
               error ? 'Error' : 
               'Bank Statement Fetched'}
            </DialogTitle>
            <DialogDescription>
              {isLoading 
                ? 'Please wait while we fetch the latest transactions from your bank.'
                : 'The bank statement processing will be handled separately.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground">Fetching transactions since {formatDate(lastPaymentDate.toISOString())}</p>
              </div>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {success && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    {success.message}
                  </AlertDescription>
                </Alert>
                
                {success.data && success.data.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Retrieved {success.data.length} new transactions</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      These transactions will be processed in the background. You can check back later to see the updated payments.
                    </p>
                    
                    <Collapsible 
                      open={isDataOpen} 
                      onOpenChange={setIsDataOpen}
                      className="mt-4 border rounded-md"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-sm font-medium text-left">
                        <span>JSON Response Data</span>
                        {isDataOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border-t">
                        <div className="flex justify-end p-2 bg-muted">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={copyToClipboard}
                            className="flex items-center gap-1 text-xs"
                          >
                            {isCopied ? (
                              <>
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy JSON
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="max-h-96 overflow-auto p-4 bg-muted/50">
                          <PrettyJSON data={success.data} />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
                
                {success.data && success.data.length === 0 && (
                  <p className="text-sm text-muted-foreground">No new transactions were found.</p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setOpen(false)} 
              disabled={isLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 