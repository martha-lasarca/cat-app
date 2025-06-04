"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, UserCog, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
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
import { toast } from "@/components/ui/use-toast"
import type { Catalogue } from "@/lib/db"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [catalogues, setCatalogues] = useState<Catalogue[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [newCatalogueName, setNewCatalogueName] = useState("")

  useEffect(() => {
    fetchCatalogues()

    const sidebarState = localStorage.getItem("sidebarCollapsed")
    if (sidebarState) {
      setIsCollapsed(sidebarState === "true")
    }
  }, [])

  const fetchCatalogues = async () => {
    try {
      const response = await fetch("/api/catalogues")
      if (response.ok) {
        const data = await response.json()
        setCatalogues(data)
      }
    } catch (error) {
      console.error("Error fetching catalogues:", error)
    }
  }

  const handleLogout = () => {
    router.push("/login")
  }

  const handleCatalogueSelect = (catalogueId: string) => {
    router.push(`/admin/editor/${catalogueId}`)
  }

  const handleCreateCatalogue = async () => {
    if (!newCatalogueName) return

    try {
      const slug = newCatalogueName.toLowerCase().replace(/\s+/g, "-")
      const response = await fetch("/api/catalogues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatalogueName, slug }),
      })

      if (response.ok) {
        const newCatalogue = await response.json()
        setCatalogues([...catalogues, newCatalogue])
        setNewCatalogueName("")
        router.push(`/admin/editor/${newCatalogue.id}`)
      } else {
        throw new Error("Failed to create catalogue")
      }
    } catch (error) {
      console.error("Error creating catalogue:", error)
      toast({
        title: "Error",
        description: "Failed to create catalogue",
        variant: "destructive",
      })
    }
  }

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", newState.toString())
    window.dispatchEvent(new CustomEvent("sidebarToggle"))
  }

  const sidebarWidth = isCollapsed ? "w-16" : "w-56"

  return (
    <div className="flex min-h-screen">
      <aside className={`hidden md:flex ${sidebarWidth} flex-col border-r bg-muted/40 transition-all duration-300`}>
        <div className="flex h-14 items-center border-b px-4 justify-between">
          {!isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
              <span>Catalogue Hub</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-start"}`}>
              <LayoutDashboard className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
              {!isCollapsed && <span>Home</span>}
            </Button>
          </Link>
          <Link href="/admin/quote-log">
            <Button variant="ghost" className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-start"}`}>
              <Users className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
              {!isCollapsed && <span>Quote Log</span>}
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-start"}`}>
              <UserCog className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
              {!isCollapsed && <span>User Management</span>}
            </Button>
          </Link>

          <Separator className="my-4" />

          {!isCollapsed && (
            <div className="space-y-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    New Catalogue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Catalogue</DialogTitle>
                    <DialogDescription>Enter a name for your new catalogue.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sidebar-name">Catalogue Name</Label>
                      <Input
                        id="sidebar-name"
                        value={newCatalogueName}
                        onChange={(e) => setNewCatalogueName(e.target.value)}
                        placeholder="e.g., Spring-2025"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateCatalogue}>Create Catalogue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <h3 className="text-sm font-medium text-muted-foreground px-2">Catalogues</h3>
              {catalogues.length > 0 ? (
                <Select onValueChange={handleCatalogueSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select catalogue" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogues.map((catalogue) => (
                      <SelectItem key={catalogue.id} value={catalogue.id}>
                        {catalogue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground px-2">No catalogues yet</p>
              )}
            </div>
          )}
        </nav>
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
            onClick={handleLogout}
          >
            {!isCollapsed && <span>Logout</span>}
            {isCollapsed && <span className="text-xs">Exit</span>}
          </Button>
        </div>
      </aside>
      <div className="flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Button variant="outline" size="icon" className="md:hidden">
            <LayoutDashboard className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
