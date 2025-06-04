"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, Trash, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  status: "active" | "pending" | "disabled"
  lastLogin?: string
  createdAt: string
  temporaryPassword?: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      email: "martha.lasarcaph@gmail.com",
      status: "active",
      lastLogin: "2024-05-24",
      createdAt: "2024-05-01",
    },
    {
      id: "2",
      email: "client@example.com",
      status: "pending",
      createdAt: "2024-05-20",
      temporaryPassword: "temp123456",
    },
  ])

  const [newUserEmail, setNewUserEmail] = useState("")
  const [isAddingUser, setIsAddingUser] = useState(false)

  const generateTemporaryPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
  }

  const handleAddUser = () => {
    if (!newUserEmail) return

    // Check if user already exists
    if (users.some((user) => user.email === newUserEmail)) {
      toast({
        title: "Error",
        description: "A user with this email already exists.",
        variant: "destructive",
      })
      return
    }

    const temporaryPassword = generateTemporaryPassword()

    const newUser: User = {
      id: Date.now().toString(),
      email: newUserEmail,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      temporaryPassword,
    }

    setUsers([...users, newUser])
    setNewUserEmail("")
    setIsAddingUser(false)

    // In a real app, this would send an email
    toast({
      title: "User Added",
      description: `Invitation sent to ${newUserEmail} with temporary password: ${temporaryPassword}`,
    })
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
    toast({
      title: "User Deleted",
      description: "User has been removed from the system.",
    })
  }

  const handleResetPassword = (userId: string) => {
    const newPassword = generateTemporaryPassword()

    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              temporaryPassword: newPassword,
              status: "pending" as const,
            }
          : user,
      ),
    )

    const user = users.find((u) => u.id === userId)
    if (user) {
      toast({
        title: "Password Reset",
        description: `New temporary password for ${user.email}: ${newPassword}`,
      })
    }
  }

  const handleSendInvitation = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user && user.temporaryPassword) {
      toast({
        title: "Invitation Sent",
        description: `Invitation email sent to ${user.email} with password: ${user.temporaryPassword}`,
      })
    }
  }

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "disabled":
        return <Badge variant="destructive">Disabled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage user access and invitations</p>
        </div>
        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will receive an email invitation with a temporary password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Add User & Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts and access permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Email</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Last Login</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
                <TableHead className="w-[150px]">Temp Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="whitespace-nowrap">{user.lastLogin || "Never"}</TableCell>
                  <TableCell className="whitespace-nowrap">{user.createdAt}</TableCell>
                  <TableCell>
                    {user.temporaryPassword ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">{user.temporaryPassword}</code>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleSendInvitation(user.id)}>
                          <Mail className="h-4 w-4 mr-1" />
                          Send Invite
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleResetPassword(user.id)}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reset Password
                      </Button>
                      {user.email !== "martha.lasarcaph@gmail.com" && (
                        <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Admin Information</CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Email:</strong> martha.lasarcaph@gmail.com
            </p>
            <p>
              <strong>Role:</strong> Administrator
            </p>
            <p>
              <strong>Status:</strong> <Badge variant="default">Active</Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
