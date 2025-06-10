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
import { AdminLayout } from "@/components/admin-layout"
import { ImageIcon, Plus, Save, Upload, Eye, Edit, Trash, X } from "lucide-react"
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
      imageUrl: "/placeholder.svg?height=800&width=600",
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

  const handleDeleteSlide = (slideId: string) => {
    if (!catalogue) return

    // Don't allow deleting the last slide
    if (catalogue.slides.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one slide in the catalogue.",
        variant: "destructive",
      })
      return
    }

    const updatedSlides = catalogue.slides.filter((slide) => slide.id !== slideId)
    const updatedCatalogue = {
      ...catalogue,
      slides: updatedSlides,
    }

    // If we're deleting the currently selected slide, select the first slide
    if (selectedSlide?.id === slideId) {
      setSelectedSlide(updatedSlides[0])
    }

    setCatalogue(updatedCatalogue)
    setHasUnsavedChanges(true)

    toast({
      title: "Slide Deleted",
      description: "The slide has been removed from the catalogue.",
    })
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
      specifications: [],
      inclusions: [],
      leadTime: {
        peak: "",
        nonPeak: "",
      },
      images: [],
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

  const handleAddSpecification = () => {
    if (!selectedProduct) return
    const updatedSpecs = [...selectedProduct.specifications, ""]
    handleUpdateProduct("specifications", updatedSpecs)
  }

  const handleUpdateSpecification = (index: number, value: string) => {
    if (!selectedProduct) return
    const updatedSpecs = [...selectedProduct.specifications]
    updatedSpecs[index] = value
    handleUpdateProduct("specifications", updatedSpecs)
  }

  const handleRemoveSpecification = (index: number) => {
    if (!selectedProduct) return
    const updatedSpecs = selectedProduct.specifications.filter((_, i) => i !== index)
    handleUpdateProduct("specifications", updatedSpecs)
  }

  const handleAddInclusion = () => {
    if (!selectedProduct) return
    const updatedInclusions = [...selectedProduct.inclusions, ""]
    handleUpdateProduct("inclusions", updatedInclusions)
  }

  const handleUpdateInclusion = (index: number, value: string) => {
    if (!selectedProduct) return
    const updatedInclusions = [...selectedProduct.inclusions]
    updatedInclusions[index] = value
    handleUpdateProduct("inclusions", updatedInclusions)
  }

  const handleRemoveInclusion = (index: number) => {
    if (!selectedProduct) return
    const updatedInclusions = selectedProduct.inclusions.filter((_, i) => i !== index)
    handleUpdateProduct("inclusions", updatedInclusions)
  }

  const handleUpdateLeadTime = (type: "peak" | "nonPeak", value: string) => {
    if (!selectedProduct) return
    const updatedLeadTime = { ...selectedProduct.leadTime, [type]: value }
    handleUpdateProduct("leadTime", updatedLeadTime)
  }

  const handleAddCustomizationOption = () => {
    if (!selectedProduct) return

    const newOption: CustomizationOption = {
      id: Date.now().toString(),
      label: "",
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
    if (activeTab !== "hotspots" || !selectedSlide || !catalogue) return

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
      setSelectedSlide(updatedSlides.find((s) => s.id === selectedSlide.id)!)

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
    if (!newHotspot || !selectedProduct || !selectedSlide || !catalogue) return

    const newHotspotObj: Hotspot = {
      id: Date.now().toString(),
      x: newHotspot.x,
      y: newHotspot.y,
      productId: selectedProduct.id,
      slideId: selectedSlide.id,
    }

    const updatedSlides = catalogue.slides.map((slide) =>
      slide.id === selectedSlide.id ? { ...slide, hotspots: [...slide.hotspots, newHotspotObj] } : slide,
    )

    const updatedCatalogue = { ...catalogue, slides: updatedSlides }
    setCatalogue(updatedCatalogue)
    setSelectedSlide(updatedSlides.find((s) => s.id === selectedSlide.id)!)
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
    if (!selectedHotspot || !catalogue || !selectedSlide) return

    const updatedSlides = catalogue.slides.map((slide) => ({
      ...slide,
      hotspots: slide.hotspots.filter((h) => h.id !== selectedHotspot.id),
    }))

    const updatedCatalogue = { ...catalogue, slides: updatedSlides }
    setCatalogue(updatedCatalogue)
    setSelectedSlide(updatedSlides.find((s) => s.id === selectedSlide.id)!)
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

  // Helper function to safely parse number values
  const safeParseFloat = (value: string): number => {
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  const safeParseInt = (value: string): number => {
    const parsed = Number.parseInt(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Get products that don't have hotspots on the selected slide
  const getAvailableProducts = () => {
    if (!catalogue || !selectedSlide) return []

    const slideHotspots = selectedSlide.hotspots || []
    const usedProductIds = slideHotspots.map((h) => h.productId)
    return catalogue.products.filter((p) => !usedProductIds.includes(p.id))
  }

  // Find the product for a given hotspot
  const getProductForHotspot = (hotspot: Hotspot) => {
    if (!catalogue) return null
    return catalogue.products.find((p) => p.id === hotspot.productId)
  }

  // Get all hotspots for the current slide
  const getCurrentSlideHotspots = () => {
    if (!selectedSlide) return []

    return selectedSlide.hotspots.map((hotspot) => ({
      ...hotspot,
      productName: getProductForHotspot(hotspot)?.name || "Unknown Product",
    }))
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Catalogue Editor</h1>
        <div className="flex gap-2 items-center">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">You have unsaved changes</span>
          )}
          <Button variant="outline" asChild>
            <Link href={`/catalogue/${catalogue.customLink || catalogue.slug}`} className="flex items-center gap-2">
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

      {/* Two Panel Layout */}
      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Functions */}
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
                <TabsTrigger value="slides">Slides</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
              </TabsList>

              <TabsContent value="slides" className="flex-1 overflow-hidden m-4 mt-4">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Slides</h3>
                    <Button size="sm" onClick={handleAddSlide}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slide
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      {catalogue.slides.map((slide, index) => (
                        <div
                          key={slide.id}
                          className={`relative rounded-md overflow-hidden cursor-pointer border-2 ${
                            selectedSlide?.id === slide.id ? "border-primary" : "border-transparent"
                          } hover:border-primary/50 transition-colors`}
                          style={{ aspectRatio: "3/4" }}
                          onClick={() => handleSelectSlide(slide)}
                        >
                          <img
                            src={slide.imageUrl || "/placeholder.svg"}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                            Slide {index + 1}
                          </div>
                          {slide.hotspots.length > 0 && (
                            <div className="absolute top-1 right-1 bg-primary text-white text-xs px-1 rounded">
                              {slide.hotspots.length}
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 left-1 h-6 w-6 opacity-0 hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSlide(slide.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedSlide && (
                    <div className="border-t pt-4 mt-4 flex justify-between">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (selectedSlide) {
                            handleDeleteSlide(selectedSlide.id)
                          }
                        }}
                        disabled={catalogue.slides.length <= 1}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete Slide
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleSlideImageUpload}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="products" className="flex-1 overflow-hidden m-4 mt-4">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Products</h3>
                    <Button size="sm" onClick={handleAddProduct}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Product
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
                    <div className="border-t pt-4 mt-4 space-y-3 max-h-96 overflow-y-auto">
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
                            value={selectedProduct.price || ""}
                            onChange={(e) => handleUpdateProduct("price", safeParseFloat(e.target.value))}
                            placeholder="Price"
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            value={selectedProduct.moq || ""}
                            onChange={(e) => handleUpdateProduct("moq", safeParseInt(e.target.value))}
                            placeholder="MOQ"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Specifications */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Specifications</Label>
                          <Button size="sm" variant="outline" onClick={handleAddSpecification}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                          {selectedProduct.specifications.map((spec, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <span className="text-xs">•</span>
                              <Input
                                value={spec}
                                onChange={(e) => handleUpdateSpecification(index, e.target.value)}
                                placeholder="Specification"
                                className="text-sm flex-1"
                              />
                              <Button size="sm" variant="outline" onClick={() => handleRemoveSpecification(index)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inclusions */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Inclusions</Label>
                          <Button size="sm" variant="outline" onClick={handleAddInclusion}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                          {selectedProduct.inclusions.map((inclusion, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <span className="text-xs">•</span>
                              <Input
                                value={inclusion}
                                onChange={(e) => handleUpdateInclusion(index, e.target.value)}
                                placeholder="Inclusion"
                                className="text-sm flex-1"
                              />
                              <Button size="sm" variant="outline" onClick={() => handleRemoveInclusion(index)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lead Time - Switched order: Non-Peak first, then Peak */}
                      <div>
                        <Label className="text-sm font-medium">Lead Time</Label>
                        <div className="space-y-2 mt-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Non-Peak</Label>
                            <Input
                              value={selectedProduct.leadTime.nonPeak}
                              onChange={(e) => handleUpdateLeadTime("nonPeak", e.target.value)}
                              placeholder="e.g., 7-10 business days"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Peak</Label>
                            <Input
                              value={selectedProduct.leadTime.peak}
                              onChange={(e) => handleUpdateLeadTime("peak", e.target.value)}
                              placeholder="e.g., 15-20 business days"
                              className="text-sm"
                            />
                          </div>
                        </div>
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

                      {/* Customization Options - Removed default text */}
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
                                value={option.price || ""}
                                onChange={(e) =>
                                  handleUpdateCustomizationOption(option.id, "price", safeParseFloat(e.target.value))
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
                          Add Hotspot
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Select Product for Hotspot</DialogTitle>
                          <DialogDescription>
                            Choose a product to associate with the new hotspot on{" "}
                            {selectedSlide && `Slide ${catalogue.slides.indexOf(selectedSlide) + 1}`}.
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
                              if (selectedProduct) {
                                // Close the dialog programmatically
                                const event = new KeyboardEvent("keydown", { key: "Escape" })
                                document.dispatchEvent(event)

                                toast({
                                  title: "Product Selected",
                                  description: `${selectedProduct.name} selected. Click on the preview image to place a hotspot.`,
                                })
                              }
                            }}
                            disabled={!selectedProduct}
                          >
                            Select Product
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Add slide selector */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Select Slide</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {catalogue.slides.map((slide, index) => (
                        <div
                          key={slide.id}
                          className={`relative rounded-md overflow-hidden cursor-pointer border-2 ${
                            selectedSlide?.id === slide.id ? "border-primary" : "border-transparent"
                          } hover:border-primary/50 transition-colors`}
                          style={{ aspectRatio: "3/4" }}
                          onClick={() => handleSelectSlide(slide)}
                        >
                          <img
                            src={slide.imageUrl || "/placeholder.svg"}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-contain"
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
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    {selectedProduct
                      ? `Click on the preview image to add a hotspot for ${selectedProduct.name}`
                      : "Select a product first, then click on the preview image to add a hotspot"}
                  </p>

                  {/* New Hotspot Positioning - Move to Left Panel */}
                  {newHotspot && selectedProduct && (
                    <div className="mt-4 p-3 border rounded-md bg-green-50 dark:bg-green-950">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">{selectedProduct.name} Hotspot</p>
                          <p className="text-sm text-muted-foreground">
                            Position: {newHotspot.x.toFixed(2)}%, {newHotspot.y.toFixed(2)}%
                          </p>
                        </div>
                        <Button onClick={handleAddHotspot} className="w-full">
                          Add Hotspot
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Selected Hotspot Info - Move to Left Panel */}
                  {selectedHotspot && !editingHotspot && (
                    <div className="mt-4 p-3 border rounded-md">
                      <div className="space-y-3">
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
                          <Button variant="outline" size="sm" onClick={handleEditHotspot} className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Position
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDeleteHotspot} className="flex-1">
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-2 mt-4">
                    <h4 className="font-medium text-sm mb-2">Hotspots on Current Slide</h4>
                    {getCurrentSlideHotspots().map((hotspot) => (
                      <div
                        key={hotspot.id}
                        className={`p-3 rounded-md border text-sm cursor-pointer ${
                          selectedHotspot?.id === hotspot.id
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/50"
                        } transition-colors`}
                        onClick={() => setSelectedHotspot(hotspot)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{hotspot.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              Position: {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%
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

                    {getCurrentSlideHotspots().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hotspots on this slide</p>
                        <p className="text-xs">Add products and place hotspots</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Panel - Preview */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview - {selectedSlide && `Slide ${catalogue.slides.indexOf(selectedSlide) + 1}`}</span>
              {editingHotspot && (
                <span className="text-sm text-blue-600 dark:text-blue-400">Click to reposition hotspot</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full pb-6">
            <div className="h-full flex items-center justify-center">
              <div
                className="relative w-full max-w-md rounded-md overflow-hidden bg-muted border cursor-crosshair"
                style={{ aspectRatio: "3/4" }}
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
                            : "bg-primary/80 animate-pulse hover:bg-primary"
                        } transition-colors`}
                        style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                        onClick={(e) => handleHotspotClick(hotspot, e)}
                      />
                    ))}

                    {newHotspot && (
                      <div
                        className="absolute w-6 h-6 rounded-full border-2 border-primary bg-primary/20 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${newHotspot.x}%`, top: `${newHotspot.y}%` }}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Select a slide to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
