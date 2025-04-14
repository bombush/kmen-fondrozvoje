"use client"

import { useState } from "react"
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
import { PlusCircle, Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserWorkflow } from "@/lib/services/workflows/user-workflow"
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
  
  const queryClient = useQueryClient()
  const userWorkflow = new UserWorkflow()
  
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
    },
    onError: (error: Error) => {
      toast.error("Error creating user", {
        description: error.message
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
              <Label htmlFor="specificSymbol">Specific Symbol</Label>
              <Input 
                id="specificSymbol" 
                value={userData.specificSymbol}
                onChange={(e) => setUserData({...userData, specificSymbol: e.target.value})}
              />
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
            <Button type="submit" disabled={isPending}>
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