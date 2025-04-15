"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { UserWorkflow } from "@/lib/services/workflows/user-workflow"
import { UserCrud } from "@/lib/services/crud/user-crud"
import { toast } from "sonner"

export function AddUserDialog() {
  const [open, setOpen] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "user",
    isActive: true,
    specificSymbol: "",
    accountNumber: "",
    bankCode: ""
  })
  
  // State for symbol validation
  const [isCheckingSymbol, setIsCheckingSymbol] = useState(false)
  const [symbolError, setSymbolError] = useState<string | null>(null)
  const [symbolValid, setSymbolValid] = useState(false)
  
  // Debounce timer ref
  const symbolCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const queryClient = useQueryClient()
  const userWorkflow = new UserWorkflow()
  const userCrud = new UserCrud()
  
  // Query to get all users for symbol validation
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userCrud.getAll(),
  })
  
  // Check if specific symbol is unique
  const checkSymbolUniqueness = (symbol: string) => {
    if (!symbol) {
      setSymbolError(null)
      setSymbolValid(false)
      return
    }
    
    setIsCheckingSymbol(true)
    
    // Clear previous timer if it exists
    if (symbolCheckTimerRef.current) {
      clearTimeout(symbolCheckTimerRef.current)
    }
    
    // Set a new timer
    symbolCheckTimerRef.current = setTimeout(() => {
      if (allUsers) {
        const isDuplicate = allUsers.some(
          user => user.specificSymbol === symbol
        )
        
        if (isDuplicate) {
          setSymbolError("This specific symbol is already in use")
          setSymbolValid(false)
        } else {
          setSymbolError(null)
          setSymbolValid(true)
        }
      }
      setIsCheckingSymbol(false)
    }, 500) // 500ms debounce
  }
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (symbolCheckTimerRef.current) {
        clearTimeout(symbolCheckTimerRef.current)
      }
    }
  }, [])
  
  const { mutate: createUser, isPending } = useMutation({
    mutationFn: async () => {
      return userWorkflow.createUser({
        ...userData,
        role: userData.role as "user" | "admin"
      })
    },
    onSuccess: (newUser) => {
      toast.success("User created", {
        description: `${newUser.name} has been created successfully.`
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpen(false)
      // Reset form
      setUserData({
        name: "",
        email: "",
        role: "user",
        isActive: true,
        specificSymbol: "",
        accountNumber: "",
        bankCode: ""
      })
      setSymbolError(null)
      setSymbolValid(false)
    },
    onError: (error: Error) => {
      toast.error("Error creating user", {
        description: error.message
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Don't submit if there's a symbol error and the symbol is provided
    if (symbolError && userData.specificSymbol) {
      toast.error("Validation error", {
        description: "Please fix the specific symbol issue before continuing"
      })
      return
    }
    
    createUser()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. Fill in the user details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={userData.name}
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={userData.role}
                onValueChange={(value) => setUserData({...userData, role: value})}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specificSymbol" className="flex items-center gap-1">
                Specific Symbol
                {isCheckingSymbol && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                {symbolValid && userData.specificSymbol && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <Input 
                id="specificSymbol" 
                value={userData.specificSymbol}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserData({...userData, specificSymbol: value});
                  checkSymbolUniqueness(value);
                }}
                className={symbolError ? "border-red-500" : ""}
              />
              {symbolError && (
                <div className="text-red-500 text-xs flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {symbolError}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input 
                  id="accountNumber" 
                  value={userData.accountNumber}
                  onChange={(e) => setUserData({...userData, accountNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankCode">Bank Code</Label>
                <Input 
                  id="bankCode" 
                  value={userData.bankCode}
                  onChange={(e) => setUserData({...userData, bankCode: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isActive" 
                checked={userData.isActive} 
                onCheckedChange={(checked) => 
                  setUserData({...userData, isActive: checked as boolean})
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isCheckingSymbol || (!!symbolError && !!userData.specificSymbol)}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 