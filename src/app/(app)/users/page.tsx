/**
 * Users management page
 * 
 * Functionality:
 * Show a list of users sorted first active/inactive, then alphabetically.
 * Search box looking for name or email
 * 
 * User row (collapsed header):
 * - Name
 * - Balance
 * - Specific symbol
 * - active-inactive icon. The icon is a green dot if active and red dot  if inactive.
 *   If the user is inactive, the text in the user row is grey.
 * 
 * User row (expanded content):
 * - Name
 * - Balance
 * - Specific symbol
 * - Variable symbol
 * - Constant symbol
 * - Email
 * - Active (green)/inactive (red) text
 * - Edit button
 * 
 * Edit mode:
 * - All fields in content are editable
 * - Active/inactive toggle
 * - Save button
 * - Cancel button
 * Show toast after editing finished
 * 
 */

"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { useUsers, useUpdateUser, useDeleteUser } from "@/hooks/use-users"
import { useAuth } from "@/contexts/auth-context"
import { useUserBalance } from "@/hooks/use-user-balance"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Edit, MoreHorizontal, Search, User as UserIcon, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { User } from "@/types"
import { UpdateUserInput } from "@/lib/services/workflows/user-workflow"
import { toast } from "sonner"
import { AddUserDialog } from "@/components/users/add-user-dialog"

function UsersPage() {
  const { isAdmin, appUser } = useAuth()
  const { data: users = [], isLoading } = useUsers(true)
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  
  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [editedUserData, setEditedUserData] = useState<UpdateUserInput>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailValid, setEmailValid] = useState(false)
  const [isCheckingSymbol, setIsCheckingSymbol] = useState(false)
  const [symbolError, setSymbolError] = useState<string | null>(null)
  const [symbolValid, setSymbolValid] = useState(false)
  
  // Debounce timer refs
  const emailCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const symbolCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Toggle row expansion
  const toggleExpand = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }
  
  // Start editing a user
  const startEditing = (user: User) => {
    setUserToEdit(user)
    setEditedUserData({
      name: user.name,
      email: user.email,
      specificSymbol: user.specificSymbol,
      variableSymbol: user.variableSymbol,
      constantSymbol: user.constantSymbol,
      bankCode: user.bankCode,
      accountNumber: user.accountNumber,
      isActive: user.isActive !== false
    })
    setEditDialogOpen(true)
    setEmailError(null)
    setEmailValid(false)
    setSymbolError(null)
    setSymbolValid(false)
  }
  
  // Save edited user
  const saveUserChanges = async () => {
    if (emailError) {
      toast.error("Validation error", {
        description: "Please fix the email issue before saving"
      })
      return
    }
    
    if (symbolError) {
      toast.error("Validation error", {
        description: "Please fix the specific symbol issue before saving"
      })
      return
    }
    
    if (!userToEdit) return
    
    try {
      await updateUserMutation.mutateAsync({
        id: userToEdit.id,
        data: editedUserData
      })
      setEditDialogOpen(false)
      toast.success("User updated successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to update user")
    }
  }
  
  // Delete (deactivate) a user
  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await deleteUserMutation.mutateAsync(userToDelete.id)
      setDeleteDialogOpen(false)
      toast.success("User deactivated successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to deactivate user")
    }
  }
  
  // Filter users by search term
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // First sort by active/inactive
        if ((a.isActive !== false) && (b.isActive === false)) return -1
        if ((a.isActive === false) && (b.isActive !== false)) return 1
        // Then sort alphabetically
        return a.name.localeCompare(b.name)
      })
  }, [users, searchTerm])

  // Add these validation functions
  const checkEmailUniqueness = (email: string, userId: string) => {
    if (!email) {
      setEmailError(null)
      setEmailValid(false)
      return
    }
    
    setIsCheckingEmail(true)
    
    // Clear previous timer if it exists
    if (emailCheckTimerRef.current) {
      clearTimeout(emailCheckTimerRef.current)
    }
    
    // Set a new timer
    emailCheckTimerRef.current = setTimeout(() => {
      if (users) {
        const isDuplicate = users.some(
          user => user.email === email && user.id !== userId
        )
        
        if (isDuplicate) {
          setEmailError("This email is already in use")
          setEmailValid(false)
        } else {
          setEmailError(null)
          setEmailValid(true)
        }
      }
      setIsCheckingEmail(false)
    }, 500) // 500ms debounce
  }

  const checkSymbolUniqueness = (symbol: string, userId: string) => {
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
      if (users) {
        const isDuplicate = users.some(
          user => user.specificSymbol === symbol && user.id !== userId
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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimerRef.current) {
        clearTimeout(emailCheckTimerRef.current)
      }
      if (symbolCheckTimerRef.current) {
        clearTimeout(symbolCheckTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="container py-8 space-y-6">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        
        {/* Display Add User button only for admins */}
        {isAdmin && (
          <AddUserDialog />
        )}
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Email</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Specific Symbol</TableHead>
              <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {filteredUsers.map(user => (
            <React.Fragment key={user.id}>
              <TableRow 
                  className={`cursor-pointer ${user.isActive === false ? 'text-muted-foreground' : ''}`}
                  onClick={() => toggleExpand(user.id)}
              >
                  <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                      {expandedUsers[user.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Badge 
                        variant={user.isActive !== false ? "ok" : "destructive"}
                        className="w-3 h-3 rounded-full p-0"
                      />
                      {user.name}
                  </div>
                </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <UserBalance userId={user.id} />
                  </TableCell>
                <TableCell>{user.specificSymbol || "-"}</TableCell>
                  <TableCell className="w-10">
                    {(isAdmin || appUser?.id === user.id) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditing(user)
                            }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {user.isActive !== false && isAdmin && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setUserToDelete(user)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
                
                {expandedUsers[user.id] && (
                  <TableRow 
                    className={user.isActive === false ? "text-muted-foreground" : ""}
                  >
                    <TableCell colSpan={7} className="p-0">
                      <div className="p-4 bg-muted/50">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              {user.name}
                              
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4">
                                  <div>
                              <div className="text-sm font-medium">Status</div>
                              <div>{user.isActive !== false ? "Active" : "Inactive"}</div>
                                    </div>
                            <div>
                              <div className="text-sm font-medium">Email</div>
                              <div>{user.email}</div>
                                  </div>
                                  <div>
                              <div className="text-sm font-medium">Balance</div>
                              <div><UserBalance userId={user.id} /></div>
                                    </div>
                            <div>
                              <div className="text-sm font-medium">Account Number</div>
                              <div>{user.accountNumber && user.bankCode ? `${user.accountNumber}/${user.bankCode}` : "—"}</div>
                                </div>
                              <div>
                              <div className="text-sm font-medium">Specific Symbol</div>
                              <div>{user.specificSymbol || "—"}</div>
                                </div>
                                  <div>
                              <div className="text-sm font-medium">Variable Symbol</div>
                              <div>{user.variableSymbol || "—"}</div>
                                  </div>
                                  <div>
                              <div className="text-sm font-medium">Constant Symbol</div>
                              <div>{user.constantSymbol || "—"}</div>
                              </div>
                          </CardContent>
                          <CardFooter>
                            {(isAdmin || appUser?.id === user.id) && (
                            <Button variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              startEditing(user);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </Button>
                            )}
                          </CardFooter>
                        </Card>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      )}
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={editedUserData.name || ''} 
                onChange={(e) => setEditedUserData({...editedUserData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                Email
                {isCheckingEmail && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                {emailValid && editedUserData.email && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <Input 
                id="email" 
                value={editedUserData.email || ''} 
                onChange={(e) => {
                  setEditedUserData({...editedUserData, email: e.target.value})
                  checkEmailUniqueness(e.target.value, userToEdit?.id || '')
                }}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && (
                <div className="text-red-500 text-xs flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {emailError}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input 
                id="accountNumber" 
                value={editedUserData.accountNumber || ''} 
                onChange={(e) => setEditedUserData({...editedUserData, accountNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankCode">Bank Code</Label>
              <Input 
                id="bankCode" 
                value={editedUserData.bankCode || ''} 
                onChange={(e) => setEditedUserData({...editedUserData, bankCode: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specificSymbol" className="flex items-center gap-1">
                Specific Symbol
                {isCheckingSymbol && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                {symbolValid && editedUserData.specificSymbol && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <Input 
                id="specificSymbol" 
                value={editedUserData.specificSymbol || ''} 
                onChange={(e) => {
                  setEditedUserData({...editedUserData, specificSymbol: e.target.value})
                  checkSymbolUniqueness(e.target.value, userToEdit?.id || '')
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isActive" 
                checked={editedUserData.isActive} 
                onCheckedChange={(checked) => 
                  setEditedUserData({...editedUserData, isActive: checked as boolean})
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveUserChanges} 
              disabled={
                updateUserMutation.isPending || 
                isCheckingEmail || 
                isCheckingSymbol || 
                !!emailError || 
                !!symbolError
              }
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the user account. All their data will be preserved, but they
              will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </div>
  )
}

function UserBalance({ userId }: { userId: string }) {
  const { data: balance = 0, isLoading } = useUserBalance(userId)
  
  if (isLoading) return <Skeleton className="h-4 w-16" />
  return <span>{balance}</span>
}

export default UsersPage