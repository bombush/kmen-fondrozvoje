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

import React, { useState, useEffect } from 'react'
import { mockUsers } from './mockUsers'
import { User } from '../../types'
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Save, 
  X, 
  Search,
  User as UserIcon,
  Mail,
  Banknote,
  Hash,
  BarChart 
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editedUser, setEditedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // On component mount, sort the users
    sortUsers(mockUsers)
  }, [])

  const sortUsers = (userList: User[]) => {
    // Sort first by active/inactive, then alphabetically by name
    const sortedUsers = [...userList].sort((a, b) => {
      // Active users come first
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1
      }
      // Then alphabetically by name
      return a.name.localeCompare(b.name)
    })
    setUsers(sortedUsers)
  }

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      return users
    }
    
    const query = searchQuery.toLowerCase()
    return users.filter(user => 
      user.name.toLowerCase().includes(query) || 
      (user.email && user.email.toLowerCase().includes(query))
    )
  }

  const toggleRow = (userId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const startEditing = (user: User) => {
    setEditingUser(user.id)
    setEditedUser({...user})
  }

  const cancelEditing = () => {
    setEditingUser(null)
    setEditedUser(null)
  }

  const handleEditChange = (field: keyof User, value: any) => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        [field]: value
      })
    }
  }

  const saveUserChanges = () => {
    if (editedUser) {
      // In a real app, this would be an API call
      setUsers(prev => prev.map(user => 
        user.id === editedUser.id ? editedUser : user
      ))
      
      toast.success("User information updated successfully")
      setEditingUser(null)
      setEditedUser(null)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Specific Symbol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filterUsers().map(user => (
            <React.Fragment key={user.id}>
              <TableRow 
                className={`cursor-pointer hover:bg-muted ${!user.isActive ? 'text-gray-500 dark:text-gray-400' : ''}`}
                onClick={() => toggleRow(user.id)}
              >
                                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`rounded-full h-3 w-3 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} 
                    />
                  </div>
                </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.balance} Kč</TableCell>
                <TableCell>{user.specificSymbol || "-"}</TableCell>

              </TableRow>
              {expandedRows.has(user.id) && (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <div className="py-4 px-6 bg-muted">
                      {editingUser === user.id && editedUser ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Edit User Information</CardTitle>
                            <CardDescription>Make changes to user profile and settings</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Tabs defaultValue="basic" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="billing">Billing Info</TabsTrigger>
                              </TabsList>
                              <TabsContent value="basic" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input 
                                      id="name" 
                                      value={editedUser.name} 
                                      onChange={(e) => handleEditChange('name', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input 
                                      id="email" 
                                      value={editedUser.email} 
                                      onChange={(e) => handleEditChange('email', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor="isActive">Active</Label>
                                  <Switch 
                                    id="isActive" 
                                    checked={editedUser.isActive}
                                    onCheckedChange={(checked) => handleEditChange('isActive', checked)}
                                  />
                                  <span className={`ml-2 text-sm font-medium ${editedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {editedUser.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </TabsContent>
                              <TabsContent value="billing" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="balance">Balance (Kč)</Label>
                                    <Input 
                                      id="balance" 
                                      type="number"
                                      value={editedUser.balance} 
                                      onChange={(e) => handleEditChange('balance', Number(e.target.value))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="specificSymbol">Specific Symbol</Label>
                                    <Input 
                                      id="specificSymbol" 
                                      value={editedUser.specificSymbol || ''} 
                                      onChange={(e) => handleEditChange('specificSymbol', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="variableSymbol">Variable Symbol</Label>
                                    <Input 
                                      id="variableSymbol" 
                                      value={editedUser.variableSymbol || ''} 
                                      onChange={(e) => handleEditChange('variableSymbol', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="constantSymbol">Constant Symbol</Label>
                                    <Input 
                                      id="constantSymbol" 
                                      value={editedUser.constantSymbol || ''} 
                                      onChange={(e) => handleEditChange('constantSymbol', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={cancelEditing}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                            <Button onClick={saveUserChanges}>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </Button>
                          </CardFooter>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <UserIcon className="h-5 w-5" />
                              {user.name}
                            </CardTitle>
                            <CardDescription>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-full rounded-md">
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <Banknote className="h-4 w-4" />
                                      Balance
                                    </div>
                                    <div className="font-semibold text-lg">{user.balance} Kč</div>
                                  </div>
                                  <Separator />
                                  <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <Hash className="h-4 w-4" />
                                      Payment Symbols
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-sm">Specific Symbol:</span>
                                        <span className="font-medium">{user.specificSymbol || "-"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Variable Symbol:</span>
                                        <span className="font-medium">{user.variableSymbol || "-"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Constant Symbol:</span>
                                        <span className="font-medium">{user.constantSymbol || "-"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <BarChart className="h-4 w-4" />
                                      Status
                                    </div>
                                    <div className={`flex items-center gap-2 font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                      <div className={`rounded-full h-3 w-3 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                      {user.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                  </div>
                                  <Separator />
                                  <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">
                                      Account Details
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-sm">Created:</span>
                                        <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm">Last Update:</span>
                                        <span className="font-medium">{new Date(user.updatedAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </ScrollArea>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              startEditing(user);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </Button>
                          </CardFooter>
                        </Card>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default UsersPage