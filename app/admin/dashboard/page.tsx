"use client"

import { useState, useRef, type KeyboardEvent, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Copy, Edit, Eye, EyeOff, FileEdit, Share, Trash, Plus } from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import type { Catalogue } from "@/lib/db"

interface ShareLink {
  id: string
  catalogueId: string
  name: string
  link: string
  password: string
  dateCreated: string
}

export default function DashboardPage() {
  const router = useRouter()
  const renameInputRef = useRef<HTMLInputElement>(null)

  const [catalogues, setCatalogues] = useState<Catalogue[]>([])
  const [loading, setLoading] = useState(true)
  const [newCatalogueName, setNewCatalogueName] = useState("")
  const [shareLink, setShareLink] = useState("")
  const [sharePassword, setSharePassword] = useState("")
  const [shareLinkName, setShareLinkName] = useState("client1")
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [selectedCatalogue, setSelectedCatalogue] = useState<Catalogue | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Listen for sidebar state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem("sidebarCollapsed") === "true"
      setSidebarCollapsed(collapsed)
    }

    handleStorageChange()
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("sidebarToggle", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("sidebarToggle", handleStorageChange)
    }
  }, [])

  useEffect(() => {
    fetchCatalogues()
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
      toast({
        title: "Error",
        description: "Failed to fetch catalogues",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  const handleDeleteCatalogue = async (id: string) => {
    try {
      const response = await fetch(`/api/catalogues/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCatalogues(catalogues.filter((catalogue) => catalogue.id !== id))
        toast({
          title: "Success",
          description: "Catalogue deleted successfully",
        })
      } else {
        throw new Error("Failed to delete catalogue")
      }
    } catch (error) {
      console.error("Error deleting catalogue:", error)
      toast({
        title: "Error",
        description: "Failed to delete catalogue",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateCatalogue = async (catalogue: Catalogue) => {
    try {
      const newName = `${catalogue.name} (Copy)`
      const newSlug = newName.toLowerCase().replace(/\s+/g, "-")

      const response = await fetch("/api/catalogues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          slides: catalogue.slides,
          products: catalogue.products,
        }),
      })

      if (response.ok) {
        const newCatalogue = await response.json()
        setCatalogues([...catalogues, newCatalogue])
        toast({
          title: "Success",
          description: "Catalogue duplicated successfully",
        })
      } else {
        throw new Error("Failed to duplicate catalogue")
      }
    } catch (error) {
      console.error("Error duplicating catalogue:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate catalogue",
        variant: "destructive",
      })
    }
  }

  const generateShareLink = (catalogue: Catalogue) => {
    if (!sharePassword || !shareLinkName) return

    const link = `${window.location.origin}/catalogue/${catalogue.slug}?client=${shareLinkName}`
    setShareLink(link)

    const newLink: ShareLink = {
      id: Date.now().toString(),
      catalogueId: catalogue.id,
      name: shareLinkName,
      link: link,
      password: sharePassword,
      dateCreated: new Date().toISOString().split("T")[0],
    }

    const exists = shareLinks.some((l) => l.catalogueId === newLink.catalogueId && l.name === newLink.name)

    if (!exists) {
      setShareLinks([...shareLinks, newLink])
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    })
  }

  const [catalogueToRename, setCatalogueToRename] = useState<Catalogue | null>(null)
  const [newName, setNewName] = useState("")

  const handleRenameCatalogue = async () => {
    if (!catalogueToRename || !newName) return

    try {
      const newSlug = newName.toLowerCase().replace(/\s+/g, "-")
      const response = await fetch(`/api/catalogues/${catalogueToRename.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, slug: newSlug }),
      })

      if (response.ok) {
        const updatedCatalogue = await response.json()
        setCatalogues(catalogues.map((cat) => (cat.id === catalogueToRename.id ? updatedCatalogue : cat)))
        setCatalogueToRename(null)
        setNewName("")
        toast({
          title: "Success",
          description: "Catalogue renamed successfully",
        })
      } else {
        throw new Error("Failed to rename catalogue")
      }
    } catch (error) {
      console.error("Error renaming catalogue:", error)
      toast({
        title: "Error",
        description: "Failed to rename catalogue",
        variant: "destructive",
      })
    }
  }

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRenameCatalogue()
    }
  }

  const catalogueGridCols = "grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4">Loading catalogues...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Catalogues</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
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
                <Label htmlFor="name">Catalogue Name</Label>
                <Input
                  id="name"
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

        <Dialog open={!!catalogueToRename} onOpenChange={(open) => !open && setCatalogueToRename(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Catalogue</DialogTitle>
              <DialogDescription>Enter a new name for your catalogue.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rename">Catalogue Name</Label>
                <Input
                  id="rename"
                  ref={renameInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  placeholder={catalogueToRename?.name}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRenameCatalogue}>Rename Catalogue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className={`${catalogueGridCols} mt-6`}>
        {catalogues.map((catalogue) => (
          <Card key={catalogue.id} className="w-full max-w-sm">
            <Link href={`/admin/editor/${catalogue.id}`} className="block cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{catalogue.name}</CardTitle>
                <CardDescription className="flex flex-col">
                  <span>{catalogue.slides?.length || 0} slides</span>
                  <span>Last updated: {new Date(catalogue.updatedAt).toLocaleDateString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-32 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                  {catalogue.slides?.[0]?.imageUrl ? (
                    <img
                      src={catalogue.slides[0].imageUrl || "/placeholder.svg"}
                      alt={catalogue.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No cover image</p>
                  )}
                </div>
              </CardContent>
            </Link>
            <CardFooter className="flex flex-col gap-4 p-6">
              <div className="grid grid-cols-6 gap-4 w-full">
                <div className="flex flex-col items-center gap-2 min-h-[80px] p-2">
                  <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                    <Link href={`/catalogue/${catalogue.slug}`}>
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                  <span className="text-xs text-muted-foreground text-center leading-tight">Preview</span>
                </div>

                <div className="flex flex-col items-center gap-2 min-h-[80px] p-2">
                  <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                    <Link href={`/admin/editor/${catalogue.id}`}>
                      <Edit className="h-3 w-3" />
                    </Link>
                  </Button>
                  <span className="text-xs text-muted-foreground text-center leading-tight">Edit</span>
                </div>

                <div className="flex flex-col items-center gap-2 min-h-[80px] p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setCatalogueToRename(catalogue)
                      setNewName(catalogue.name)
                      setTimeout(() => {
                        renameInputRef.current?.focus()
                      }, 100)
                    }}
                  >
                    <FileEdit className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground text-center leading-tight">Rename</span>
                </div>

                <div className="flex flex-col items-center gap-2 min-h-[80px] p-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Share className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[825px]">
                      <DialogHeader>
                        <DialogTitle>Share Catalogue</DialogTitle>
                        <DialogDescription>
                          Share your catalogue publicly or create password-protected links for clients.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Panel - Generated Links */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Generated Links</h4>
                          {shareLinks.filter((link) => link.catalogueId === catalogue.id).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No links generated yet.</p>
                          ) : (
                            <div className="border rounded-md">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">Name</TableHead>
                                    <TableHead className="text-xs">Link</TableHead>
                                    <TableHead className="text-xs">Password</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {shareLinks
                                    .filter((link) => link.catalogueId === catalogue.id)
                                    .map((link) => (
                                      <TableRow key={link.id}>
                                        <TableCell className="text-xs">{link.dateCreated}</TableCell>
                                        <TableCell className="text-xs font-medium">{link.name}</TableCell>
                                        <TableCell className="text-xs">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() => copyToClipboard(link.link)}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copy
                                          </Button>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() => copyToClipboard(link.password)}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copy
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>

                        {/* Right Panel - Public & Private Links */}
                        <div className="space-y-6">
                          {/* Public View Section */}
                          <div className="space-y-3">
                            <h4 className="font-medium">Public View</h4>
                            <p className="text-sm text-muted-foreground">
                              Share this link for public access (no password required)
                            </p>
                            <div className="flex items-center gap-2">
                              <Input
                                value={`${window.location.origin}/catalogue/${catalogue.slug}`}
                                readOnly
                                className="text-sm"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(`${window.location.origin}/catalogue/${catalogue.slug}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Generate Password-Protected Link Section */}
                          <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium">Generate Password-Protected Link</h4>
                            <div className="grid gap-2">
                              <Label htmlFor="share-link-name">Link Name</Label>
                              <Input
                                id="share-link-name"
                                value={shareLinkName}
                                onChange={(e) => setShareLinkName(e.target.value)}
                                placeholder="e.g., client1"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="password">Password</Label>
                              <div className="flex items-center gap-2 relative">
                                <Input
                                  id="password"
                                  value={sharePassword}
                                  onChange={(e) => setSharePassword(e.target.value)}
                                  placeholder="Enter a password for this share link"
                                  type={showPassword ? "text" : "password"}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                </Button>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="share-link">Protected Share Link</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="share-link"
                                  value={shareLink || "Click 'Generate Link' to create a protected share link"}
                                  readOnly
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => shareLink && copyToClipboard(shareLink)}
                                  disabled={!shareLink}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Button onClick={() => generateShareLink(catalogue)} className="w-full">
                              Generate Protected Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <span className="text-xs text-muted-foreground text-center leading-tight">Share</span>
                </div>

                <div className="flex flex-col items-center gap-2 min-h-[80px] p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDuplicateCatalogue(catalogue)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground text-center leading-tight">Duplicate</span>
                </div>

                <div className="flex flex-col items-center gap-2 min-h-[80px] p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteCatalogue(catalogue.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground text-center leading-tight">Delete</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AdminLayout>
  )
}
