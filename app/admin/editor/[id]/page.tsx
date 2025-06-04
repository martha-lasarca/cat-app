"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { ImageIcon, Plus, Save, Upload, Eye, Edit, Trash, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Catalogue, Product, Slide, Hotspot } from "@/lib/db"

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
      customization: {
        engraved: false,
        printed: false,
        engravedPrice: 0,
        printedPrice: 0,
      },
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Catalogue Editor</h1>
        <div className="flex gap-2 items-center">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">You have unsaved changes</span>
          )}
          <Button variant="outline" asChild>
            <Link href={`/catalogue/${catalogue.slug}`} className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="slides">Slides</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
                </TabsList>

                <TabsContent value="slides" className="mt-4">
                  <div className="flex flex-wrap gap-4 mb-4">
                    {catalogue.slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`relative w-24 h-24 rounded-md overflow-hidden cursor-pointer border-2 ${
                          selectedSlide?.id === slide.id ? "border-primary" : "border-transparent"
                        }`}
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
                      </div>
                    ))}
                    <div
                      className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:bg-muted/50"
                      onClick={handleAddSlide}
                    >
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>

                  {selectedSlide && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? "Uploading..." : "Upload Image"}
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleSlideImageUpload}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Upload a new image for the selected slide.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="products" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {catalogue.products.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 rounded-md cursor-pointer border ${
                          selectedProduct?.id === product.id ? "border-primary" : "border-muted"
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ₱{product.price.toFixed(2)} • MOQ: {product.moq}
                        </p>
                        <div className="mt-2 flex gap-1 overflow-x-auto">
                          {product.images.slice(0, 3).map((img, idx) => (
                            <div key={idx} className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                              <img
                                src={img || "/placeholder.svg"}
                                alt={`${product.name} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {product.images.length > 3 && (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-xs">+{product.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div
                      className="p-4 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:bg-muted/50"
                      onClick={handleAddProduct}
                    >
                      <Plus className="h-6 w-6 text-muted-foreground mr-2" />
                      <span>Add Product</span>
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="space-y-4 border rounded-md p-4">
                      <h3 className="font-medium">Edit Product</h3>
                      <div className="space-y-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input
                          id="product-name"
                          value={selectedProduct.name}
                          onChange={(e) => handleUpdateProduct("name", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Base Price (₱)</Label>
                          <Input
                            id="product-price"
                            type="number"
                            value={selectedProduct.price}
                            onChange={(e) => handleUpdateProduct("price", Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-moq">MOQ</Label>
                          <Input
                            id="product-moq"
                            type="number"
                            value={selectedProduct.moq}
                            onChange={(e) => handleUpdateProduct("moq", Number.parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-description">Description</Label>
                        <Textarea
                          id="product-description"
                          value={selectedProduct.description}
                          onChange={(e) => handleUpdateProduct("description", e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Product Images Section */}
                      <div className="space-y-2">
                        <Label>Product Images</Label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {selectedProduct.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`${selectedProduct.name} ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-md border"
                              />
                              <button
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveProductImage(index)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div
                            className="border-2 border-dashed border-muted-foreground rounded-md flex items-center justify-center aspect-square cursor-pointer hover:bg-muted/50"
                            onClick={() => productImageInputRef.current?.click()}
                          >
                            <Plus className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={productImageInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          multiple
                        />
                        <p className="text-xs text-muted-foreground">
                          Add multiple product images. The first image will be used as the main product image.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Customization Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 border rounded-md p-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="engraved"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={selectedProduct.customization?.engraved || false}
                                onChange={(e) =>
                                  handleUpdateProduct("customization", {
                                    ...selectedProduct.customization,
                                    engraved: e.target.checked,
                                  })
                                }
                              />
                              <Label htmlFor="engraved">Engraved</Label>
                            </div>
                            {selectedProduct.customization?.engraved && (
                              <div className="mt-2">
                                <Label htmlFor="engraved-price">Additional Price (₱)</Label>
                                <Input
                                  id="engraved-price"
                                  type="number"
                                  value={selectedProduct.customization.engravedPrice}
                                  onChange={(e) =>
                                    handleUpdateProduct("customization", {
                                      ...selectedProduct.customization,
                                      engravedPrice: Number.parseFloat(e.target.value),
                                    })
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 border rounded-md p-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="printed"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={selectedProduct.customization?.printed || false}
                                onChange={(e) =>
                                  handleUpdateProduct("customization", {
                                    ...selectedProduct.customization,
                                    printed: e.target.checked,
                                  })
                                }
                              />
                              <Label htmlFor="printed">Printed</Label>
                            </div>
                            {selectedProduct.customization?.printed && (
                              <div className="mt-2">
                                <Label htmlFor="printed-price">Additional Price (₱)</Label>
                                <Input
                                  id="printed-price"
                                  type="number"
                                  value={selectedProduct.customization.printedPrice}
                                  onChange={(e) =>
                                    handleUpdateProduct("customization", {
                                      ...selectedProduct.customization,
                                      printedPrice: Number.parseFloat(e.target.value),
                                    })
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hotspots" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Manage Hotspots</h3>
                      <div className="flex gap-2">
                        <Select
                          value={selectedSlideForHotspots?.id}
                          onValueChange={(value) => {
                            const slide = catalogue.slides.find((s) => s.id === value)
                            if (slide) setSelectedSlideForHotspots(slide)
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select slide" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogue.slides.map((slide, index) => (
                              <SelectItem key={slide.id} value={slide.id}>
                                Slide {index + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Add Hotspot
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
                              <div className="grid grid-cols-1 gap-2">
                                {getAvailableProducts().length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    All products already have hotspots on this slide.
                                  </p>
                                ) : (
                                  getAvailableProducts().map((product) => (
                                    <div
                                      key={product.id}
                                      className={`p-4 rounded-md cursor-pointer border ${
                                        selectedProduct?.id === product.id ? "border-primary" : "border-muted"
                                      }`}
                                      onClick={() => setSelectedProduct(product)}
                                    >
                                      <h3 className="font-medium">{product.name}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        ₱{product.price.toFixed(2)} • MOQ: {product.moq}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => {
                                  const dialogElement = document.querySelector("[role='dialog']")
                                  if (dialogElement) {
                                    const closeButton = dialogElement.querySelector("button[data-state]")
                                    if (closeButton instanceof HTMLElement) {
                                      closeButton.click()
                                    }
                                  }

                                  toast({
                                    title: "Product Selected",
                                    description: selectedProduct
                                      ? `${selectedProduct.name} selected. Now click on the image to place a hotspot.`
                                      : "Please select a product first.",
                                  })
                                }}
                                disabled={!selectedProduct}
                              >
                                Select Product
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {selectedProduct
                        ? `Click on the image to add a hotspot for ${selectedProduct.name}`
                        : "Select a product first, then click on the image to add a hotspot"}
                    </p>

                    {newHotspot && selectedProduct && (
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <p className="font-medium">{selectedProduct.name} Hotspot</p>
                          <p className="text-sm text-muted-foreground">
                            Position: {newHotspot.x.toFixed(2)}%, {newHotspot.y.toFixed(2)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Slide: {selectedSlideForHotspots && catalogue.slides.indexOf(selectedSlideForHotspots) + 1}
                          </p>
                        </div>
                        <Button onClick={handleAddHotspot}>Add Hotspot</Button>
                      </div>
                    )}

                    {/* All Hotspots List */}
                    {getAllHotspots().length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">All Hotspots</h3>
                        <div className="space-y-2">
                          {getAllHotspots().map((hotspot) => (
                            <div
                              key={hotspot.id}
                              className={`p-3 border rounded-md ${
                                selectedHotspot?.id === hotspot.id ? "border-primary" : ""
                              }`}
                              onClick={() => {
                                setSelectedHotspot(hotspot)
                                const slide = catalogue.slides.find((s) => s.id === hotspot.slideId)
                                if (slide) setSelectedSlideForHotspots(slide)
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{hotspot.productName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {hotspot.slideName} • Position: {hotspot.x.toFixed(2)}%, {hotspot.y.toFixed(2)}%
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedHotspot(hotspot)
                                      const slide = catalogue.slides.find((s) => s.id === hotspot.slideId)
                                      if (slide) setSelectedSlideForHotspots(slide)
                                      handleEditHotspot()
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedHotspot(hotspot)
                                      handleDeleteHotspot()
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">
                Preview -{" "}
                {selectedSlideForHotspots && `Slide ${catalogue.slides.indexOf(selectedSlideForHotspots) + 1}`}
              </h3>
              <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-muted" onClick={handleSlideClick}>
                {selectedSlideForHotspots ? (
                  <>
                    <img
                      src={selectedSlideForHotspots.imageUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />

                    {selectedSlideForHotspots.hotspots.map((hotspot) => (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
