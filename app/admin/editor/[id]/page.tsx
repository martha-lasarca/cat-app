"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AdminLayout } from "@/components/admin-layout"
import { ImageIcon, Plus, Save, Upload, Eye, Edit, Trash, X, LinkIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Catalogue, Product, Slide, Hotspot, CustomizationOption } from "@/lib/db"

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const catalogueId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const productImageInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState("slides")
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [newHotspot, setNewHotspot] = useState<{ x: number; y: number } | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedSlideForHotspots, setSelectedSlideForHotspots] = useState<Slide | null>(null)
  const [uploading, setUploading] = useState(false)
  const [customLink, setCustomLink] = useState("")

  useEffect(() => {
    fetchCatalogue()
  }, [catalogueId])

  const fetchCatalogue = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/catalogues/${catalogueId}`)
      if (response.ok) {
        const data = await response.json()
        setCatalogue(data)
        setCustomLink(data.customLink || "")
        if (data.slides.length > 0) {
          setSelectedSlide(data.slides[0])
          setSelectedSlideForHotspots(data.slides[0])
        }
      } else {
        console.error("Catalogue not found")
        toast({
          title: "Error",
          description: "Catalogue not found",
          variant: "destructive",
        })
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Error fetching catalogue:", error)
      toast({
        title: "Error",
        description: "Failed to load catalogue",
        variant: "destructive",
      })
      router.push("/admin/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const saveCatalogue = async (updatedCatalogue: Catalogue) => {
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCatalogue),
      })

      if (response.ok) {
        const savedCatalogue = await response.json()
        setCatalogue(savedCatalogue)
        setHasUnsavedChanges(false)
        toast({
          title: "Success",
          description: "Changes saved successfully",
        })
      } else {
        throw new Error("Failed to save catalogue")
      }
    } catch (error) {
      console.error("Error saving catalogue:", error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    }
  }

  const handleSaveCustomLink = async () => {
    if (!catalogue) return

    const updatedCatalogue = {
      ...catalogue,
      customLink: customLink || undefined,
    }

    await saveCatalogue(updatedCatalogue)
  }

  const handleCopyLink = () => {
    const link = customLink
      ? `${window.location.origin}/catalogue/${customLink}`
      : `${window.location.origin}/catalogue/${catalogue?.slug}`

    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "The catalogue link has been copied to your clipboard",
    })
  }

  const handleAddSlide = () => {
    if (!catalogue) return

    const newSlide: Slide = {
      id: Date.now().toString(),
      imageUrl: "/placeholder.svg?height=600&width=800",
      hotspots: [],
    }

    const updatedCatalogue = {
      ...catalogue,
      slides: [...catalogue.slides, newSlide],
    }

    setCatalogue(updatedCatalogue)
    setSelectedSlide(newSlide)
    setHasUnsavedChanges(true)
  }

  const handleSelectSlide = (slide: Slide) => {
    setSelectedSlide(slide)
    setSelectedSlideForHotspots(slide)
  }

  const handleAddProduct = () => {
    if (!catalogue) return

    const newProduct: Product = {
      id: Date.now().toString(),
      name: "New Product",
      price: 0,
      moq: 1,
      description: "",
      images: ["/placeholder.svg?height=600&width=800"],
      customizationOptions: [],
    }

    const updatedCatalogue = {
      ...catalogue,
      products: [...catalogue.products, newProduct],
    }

    setCatalogue(updatedCatalogue)
    setSelectedProduct(newProduct)
    setHasUnsavedChanges(true)
  }

  const handleUpdateProduct = (field: keyof Product, value: any) => {
    if (!selectedProduct || !catalogue) return

    const updatedProduct = { ...selectedProduct, [field]: value }
    setSelectedProduct(updatedProduct)

    const updatedCatalogue = {
      ...catalogue,
      products: catalogue.products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)),
    }

    setCatalogue(updatedCatalogue)
    setHasUnsavedChanges(true)
  }

  const handleAddCustomizationOption = () => {
    if (!selectedProduct) return

    const newOption: CustomizationOption = {
      id: Date.now().toString(),
      label: "New Option",
      price: 0,
    }

    const updatedOptions = [...selectedProduct.customizationOptions, newOption]
    handleUpdateProduct("customizationOptions", updatedOptions)
  }

  const handleUpdateCustomizationOption = (optionId: string, field: keyof CustomizationOption, value: any) => {
    if (!selectedProduct) return

    const updatedOptions = selectedProduct.customizationOptions.map((option) =>
      option.id === optionId ? { ...option, [field]: value } : option,
    )
    handleUpdateProduct("customizationOptions", updatedOptions)
  }

  const handleRemoveCustomizationOption = (optionId: string) => {
    if (!selectedProduct) return

    const updatedOptions = selectedProduct.customizationOptions.filter((option) => option.id !== optionId)
    handleUpdateProduct("customizationOptions", updatedOptions)
  }

  const handleSlideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== "hotspots" || !selectedSlideForHotspots || !catalogue) return

    // If we're editing a hotspot, update its position
    if (editingHotspot) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      const updatedSlides = catalogue.slides.map((slide) => ({
        ...slide,
        hotspots: slide.hotspots.map((h) => (h.id === editingHotspot.id ? { ...h, x, y } : h)),
      }))

      const updatedCatalogue = { ...catalogue, slides: updatedSlides }
      setCatalogue(updatedCatalogue)
      setSelectedSlideForHotspots(updatedSlides.find((s) => s.id === selectedSlideForHotspots.id)!)

      setEditingHotspot({ ...editingHotspot, x, y })
      setSelectedHotspot({ ...editingHotspot, x, y })

      toast({
        title: "Hotspot Updated",
        description: "The hotspot position has been updated.",
      })

      setHasUnsavedChanges(true)
      setEditingHotspot(null)
      return
    }

    // If we're adding a new hotspot
    if (selectedProduct) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      setNewHotspot({ x, y })
    }
  }

  const handleAddHotspot = () => {
    if (!newHotspot || !selectedProduct || !selectedSlideForHotspots || !catalogue) return

    const newHotspotObj: Hotspot = {
      id: Date.now().toString(),
      x: newHotspot.x,
      y: newHotspot.y,
      productId: selectedProduct.id,
      slideId: selectedSlideForHotspots.id,
    }

    const updatedSlides = catalogue.slides.map((slide) =>
      slide.id === selectedSlideForHotspots.id ? { ...slide, hotspots: [...slide.hotspots, newHotspotObj] } : slide,
    )

    const updatedCatalogue = { ...catalogue, slides: updatedSlides }
    setCatalogue(updatedCatalogue)
    setSelectedSlideForHotspots(updatedSlides.find((s) => s.id === selectedSlideForHotspots.id)!)
    setNewHotspot(null)
    setHasUnsavedChanges(true)

    toast({
      title: "Hotspot Added",
      description: `Hotspot for ${selectedProduct.name} added successfully.`,
    })
  }

  const handleHotspotClick = (hotspot: Hotspot, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedHotspot(hotspot)
  }

  const handleEditHotspot = () => {
    if (!selectedHotspot) return
    setEditingHotspot(selectedHotspot)
    toast({
      title: "Edit Hotspot",
      description: "Click on the image to reposition the hotspot.",
    })
  }

  const handleDeleteHotspot = () => {
    if (!selectedHotspot || !catalogue) return

    const updatedSlides = catalogue.slides.map((slide) => ({
      ...slide,
      hotspots: slide.hotspots.filter((h) => h.id !== selectedHotspot.id),
    }))

    const updatedCatalogue = { ...catalogue, slides: updatedSlides }
    setCatalogue(updatedCatalogue)
    setSelectedSlideForHotspots(updatedSlides.find((s) => s.id === selectedSlideForHotspots.id)!)
    setHasUnsavedChanges(true)

    toast({
      title: "Hotspot Deleted",
      description: "The hotspot has been removed.",
    })

    setSelectedHotspot(null)
  }

  const handleSaveChanges = () => {
    if (!catalogue) return
    saveCatalogue(catalogue)
  }

  const handleFileUpload = async (file: File, folder: "slides" | "products" = "slides") => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await response.json()
      return url
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedSlide || !catalogue) return

    const file = e.target.files[0]
    const url = await handleFileUpload(file, "slides")

    if (url) {
      const updatedSlides = catalogue.slides.map((slide) =>
        slide.id === selectedSlide.id ? { ...slide, imageUrl: url } : slide,
      )

      const updatedCatalogue = { ...catalogue, slides: updatedSlides }
      setCatalogue(updatedCatalogue)
      setSelectedSlide({ ...selectedSlide, imageUrl: url })
      setHasUnsavedChanges(true)

      toast({
        title: "Image Uploaded",
        description: "Slide image updated successfully.",
      })
    }
  }

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProduct || !e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    const newImages = [...selectedProduct.images]

    for (const file of files) {
      const url = await handleFileUpload(file, "products")
      if (url) {
        newImages.push(url)
      }
    }

    handleUpdateProduct("images", newImages)

    toast({
      title: "Images Added",
      description: `${files.length} image(s) added to ${selectedProduct.name}.`,
    })
  }

  const handleRemoveProductImage = (index: number) => {
    if (!selectedProduct) return

    const newImages = [...selectedProduct.images]
    newImages.splice(index, 1)

    handleUpdateProduct("images", newImages)
  }

  // Get products that don't have hotspots on the selected slide
  const getAvailableProducts = () => {
    if (!catalogue || !selectedSlideForHotspots) return []

    const slideHotspots = selectedSlideForHotspots.hotspots || []
    const usedProductIds = slideHotspots.map((h) => h.productId)
    return catalogue.products.filter((p) => !usedProductIds.includes(p.id))
  }

  // Find the product for a given hotspot
  const getProductForHotspot = (hotspot: Hotspot) => {
    if (!catalogue) return null
    return catalogue.products.find((p) => p.id === hotspot.productId)
  }

  // Get all hotspots across all slides
  const getAllHotspots = () => {
    if (!catalogue) return []

    return catalogue.slides.flatMap((slide) =>
      slide.hotspots.map((hotspot) => ({
        ...hotspot,
        slideName: `Slide ${catalogue.slides.indexOf(slide) + 1}`,
        productName: getProductForHotspot(hotspot)?.name || "Unknown Product",
      })),
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4">Loading catalogue...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!catalogue) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Catalogue Not Found</h1>
            <p>The requested catalogue could not be found.</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Catalogue Editor</h1>
        <div className="flex gap-2 items-center">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">You have unsaved changes</span>
          )}
          <Button variant="outline" onClick={handleCopyLink}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/catalogue/${customLink || catalogue.slug}`} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button className="gap-2" onClick={handleSaveChanges} disabled={!hasUnsavedChanges}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Custom Link Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Custom Share Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="custom-link">Custom Link (optional)</Label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {window.location.origin}/catalogue/
                </span>
                <Input
                  id="custom-link"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  placeholder={catalogue.slug}
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSaveCustomLink}>Save Link</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Create a custom short link for easy sharing. Leave empty to use the default slug.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Slides Panel */}
        <div className="col-span-3">
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle className="text-lg">Slides</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {catalogue.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`relative w-full aspect-video rounded-md overflow-hidden cursor-pointer border-2 ${
                      selectedSlide?.id === slide.id ? "border-primary" : "border-transparent"
                    } hover:border-primary/50 transition-colors`}
                    onClick={() => handleSelectSlide(slide)}
                  >
                    <img
                      src={slide.imageUrl || "/placeholder.svg"}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      Slide {index + 1}
                    </div>
                    {slide.hotspots.length > 0 && (
                      <div className="absolute top-1 right-1 bg-primary text-white text-xs px-1 rounded">
                        {slide.hotspots.length}
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="outline" className="w-full aspect-video border-dashed" onClick={handleAddSlide}>
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Main Preview */}
        <div className="col-span-6">
          <Card className="h-[calc(100vh-200px)]">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">
                  Preview - {selectedSlide && `Slide ${catalogue.slides.indexOf(selectedSlide) + 1}`}
                </h3>
                {selectedSlide && (
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div
                  className="relative w-full max-w-4xl rounded-md overflow-hidden bg-muted border cursor-crosshair"
                  style={{ aspectRatio: "16/9" }}
                  onClick={handleSlideClick}
                >
                  {selectedSlide ? (
                    <>
                      <img
                        src={selectedSlide.imageUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />

                      {selectedSlide.hotspots.map((hotspot) => (
                        <div
                          key={hotspot.id}
                          className={`absolute w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                            selectedHotspot?.id === hotspot.id || editingHotspot?.id === hotspot.id
                              ? "bg-blue-500 ring-2 ring-white"
                              : "bg-primary/80 animate-pulse"
                          }`}
                          style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                          onClick={(e) => handleHotspotClick(hotspot, e)}
                        />
                      ))}

                      {newHotspot && (
                        <div
                          className="absolute w-6 h-6 rounded-full border-2 border-primary -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${newHotspot.x}%`, top: `${newHotspot.y}%` }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleSlideImageUpload}
              />

              {/* Selected Hotspot Info */}
              {selectedHotspot && !editingHotspot && (
                <div className="mt-4 p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Selected Hotspot</h4>
                      <p className="text-sm text-muted-foreground">
                        Product: {getProductForHotspot(selectedHotspot)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Position: {selectedHotspot.x.toFixed(2)}%, {selectedHotspot.y.toFixed(2)}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleEditHotspot}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDeleteHotspot}>
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Editing Hotspot Info */}
              {editingHotspot && (
                <div className="mt-4 p-3 border border-blue-500 rounded-md bg-blue-50 dark:bg-blue-950">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Editing Hotspot</p>
                  <p className="text-sm">Click on the image to reposition the hotspot.</p>
                </div>
              )}

              {/* New Hotspot Confirmation */}
              {newHotspot && selectedProduct && (
                <div className="mt-4 p-3 border rounded-md bg-green-50 dark:bg-green-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedProduct.name} Hotspot</p>
                      <p className="text-sm text-muted-foreground">
                        Position: {newHotspot.x.toFixed(2)}%, {newHotspot.y.toFixed(2)}%
                      </p>
                    </div>
                    <Button onClick={handleAddHotspot}>Add Hotspot</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Content Panel */}
        <div className="col-span-3">
          <Card className="h-[calc(100vh-200px)]">
            <CardContent className="p-0 h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="flex-1 overflow-hidden m-4 mt-4">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Products</h3>
                      <Button size="sm" onClick={handleAddProduct}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {catalogue.products.map((product) => (
                        <div
                          key={product.id}
                          className={`p-3 rounded-md cursor-pointer border text-sm ${
                            selectedProduct?.id === product.id
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          } transition-colors`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="flex items-start gap-2">
                            <img
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{product.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                ₱{product.price.toFixed(2)} • MOQ: {product.moq}
                              </p>
                              {product.customizationOptions.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {product.customizationOptions.length} option(s)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedProduct && (
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <h4 className="font-medium">Edit Product</h4>
                        <div className="space-y-2">
                          <Input
                            value={selectedProduct.name}
                            onChange={(e) => handleUpdateProduct("name", e.target.value)}
                            placeholder="Product name"
                            className="text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              value={selectedProduct.price}
                              onChange={(e) => handleUpdateProduct("price", Number.parseFloat(e.target.value))}
                              placeholder="Price"
                              className="text-sm"
                            />
                            <Input
                              type="number"
                              value={selectedProduct.moq}
                              onChange={(e) => handleUpdateProduct("moq", Number.parseInt(e.target.value))}
                              placeholder="MOQ"
                              className="text-sm"
                            />
                          </div>
                          <Textarea
                            value={selectedProduct.description}
                            onChange={(e) => handleUpdateProduct("description", e.target.value)}
                            placeholder="Description"
                            rows={2}
                            className="text-sm"
                          />
                        </div>

                        {/* Product Images */}
                        <div>
                          <Label className="text-sm">Images</Label>
                          <div className="grid grid-cols-3 gap-1 mt-1">
                            {selectedProduct.images.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image || "/placeholder.svg"}
                                  alt={`${selectedProduct.name} ${index + 1}`}
                                  className="w-full aspect-square object-cover rounded border"
                                />
                                <button
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveProductImage(index)
                                  }}
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </div>
                            ))}
                            <button
                              className="border-2 border-dashed border-muted-foreground rounded aspect-square flex items-center justify-center hover:bg-muted/50"
                              onClick={() => productImageInputRef.current?.click()}
                            >
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                          <input
                            type="file"
                            ref={productImageInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleProductImageUpload}
                            multiple
                          />
                        </div>

                        {/* Customization Options */}
                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Customization Options</Label>
                            <Button size="sm" variant="outline" onClick={handleAddCustomizationOption}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2 mt-2">
                            {selectedProduct.customizationOptions.map((option) => (
                              <div key={option.id} className="flex gap-2 items-center">
                                <Input
                                  value={option.label}
                                  onChange={(e) => handleUpdateCustomizationOption(option.id, "label", e.target.value)}
                                  placeholder="Option name"
                                  className="text-sm flex-1"
                                />
                                <Input
                                  type="number"
                                  value={option.price}
                                  onChange={(e) =>
                                    handleUpdateCustomizationOption(
                                      option.id,
                                      "price",
                                      Number.parseFloat(e.target.value),
                                    )
                                  }
                                  placeholder="Price"
                                  className="text-sm w-20"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveCustomizationOption(option.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="hotspots" className="flex-1 overflow-hidden m-4 mt-4">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Hotspots</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Product for Hotspot</DialogTitle>
                            <DialogDescription>
                              Choose a product to associate with the new hotspot on{" "}
                              {selectedSlideForHotspots &&
                                `Slide ${catalogue.slides.indexOf(selectedSlideForHotspots) + 1}`}
                              .
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                              {getAvailableProducts().length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  All products already have hotspots on this slide.
                                </p>
                              ) : (
                                getAvailableProducts().map((product) => (
                                  <div
                                    key={product.id}
                                    className={`p-3 rounded-md cursor-pointer border text-sm ${
                                      selectedProduct?.id === product.id
                                        ? "border-primary bg-primary/5"
                                        : "border-muted hover:border-primary/50"
                                    }`}
                                    onClick={() => setSelectedProduct(product)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={product.images[0] || "/placeholder.svg"}
                                        alt={product.name}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                      <div>
                                        <h4 className="font-medium">{product.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                          ₱{product.price.toFixed(2)} • MOQ: {product.moq}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                // Auto-close the dialog
                                const closeButton = document.querySelector(
                                  '[data-state="open"] button[aria-label="Close"]',
                                ) as HTMLElement
                                if (closeButton) closeButton.click()

                                toast({
                                  title: "Product Selected",
                                  description: selectedProduct
                                    ? `${selectedProduct.name} selected. Now click on the image to place a hotspot.`
                                    : "Please select a product first.",
                                })
                              }}
                              disabled={!selectedProduct}
                            >
                              Select Product & Close
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">
                      {selectedProduct
                        ? `Click on the image to add a hotspot for ${selectedProduct.name}`
                        : "Select a product first, then click on the image to add a hotspot"}
                    </p>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {getAllHotspots().map((hotspot) => (
                        <div
                          key={hotspot.id}
                          className={`p-3 rounded-md border text-sm cursor-pointer ${
                            selectedHotspot?.id === hotspot.id
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          } transition-colors`}
                          onClick={() => {
                            setSelectedHotspot(hotspot)
                            const slide = catalogue.slides.find((s) => s.id === hotspot.slideId)
                            if (slide) {
                              setSelectedSlideForHotspots(slide)
                              setSelectedSlide(slide)
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{hotspot.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {hotspot.slideName} • {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedHotspot(hotspot)
                                  const slide = catalogue.slides.find((s) => s.id === hotspot.slideId)
                                  if (slide) {
                                    setSelectedSlideForHotspots(slide)
                                    setSelectedSlide(slide)
                                  }
                                  handleEditHotspot()
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedHotspot(hotspot)
                                  handleDeleteHotspot()
                                }}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {getAllHotspots().length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hotspots yet</p>
                          <p className="text-xs">Add products and place hotspots on slides</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
