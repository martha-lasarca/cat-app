"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import type { Catalogue, Product, Hotspot } from "@/lib/db"

interface CartItem {
  product: Product
  quantity: number
  selectedOptions: { [optionId: string]: boolean }
}

export default function PublicCataloguePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const clientParam = searchParams.get('client')

  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<{ [optionId: string]: boolean }>({})
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [email, setEmail] = useState("")

  useEffect(() => {
    fetchCatalogue()
  }, [slug, clientParam])

  const fetchCatalogue = async () => {
    try {
      // Try fetching by slug first
      let response = await fetch(`/api/catalogues/slug/${slug}`)

      // If not found by slug, try by custom link
      if (!response.ok) {
        response = await fetch(`/api/catalogues/link/${slug}`)
      }

      if (response.ok) {
        const data = await response.json()
        setCatalogue(data)
      } else {
        console.error("Catalogue not found")
      }
    } catch (error) {
      console.error("Error fetching catalogue:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4">Loading catalogue...</p>
        </div>
      </div>
    )
  }

  if (!catalogue) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Catalogue Not Found</h1>
          <p>The requested catalogue could not be found.</p>
        </div>
      </div>
    )
  }

  const currentSlide = catalogue.slides[currentSlideIndex]

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? catalogue.slides.length - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev === catalogue.slides.length - 1 ? 0 : prev + 1))
  }

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (!hotspot || !catalogue) return

    const product = catalogue.products.find((p) => p.id === hotspot.productId)
    if (!product) return

    setSelectedProduct(product)
    setSelectedQuantity(product.moq || 1)
    setSelectedImageIndex(0)
    setSelectedOptions({})
  }

  const handleCloseProductModal = () => {
    setSelectedProduct(null)
    setSelectedQuantity(0)
    setSelectedOptions({})
  }

  const handleQuantityChange = (value: number) => {
    if (!selectedProduct) return
    const newQuantity = Math.max(selectedProduct.moq, value)
    setSelectedQuantity(newQuantity)
  }

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }))
  }

  const getSelectedOptionsPrice = () => {
    if (!selectedProduct) return 0
    return selectedProduct.customizationOptions
      .filter((option) => selectedOptions[option.id])
      .reduce((total, option) => total + option.price, 0)
  }

  const getTotalPrice = () => {
    if (!selectedProduct) return 0
    return selectedProduct.price + getSelectedOptionsPrice()
  }

  const handleAddToCart = () => {
    if (!selectedProduct || selectedQuantity < selectedProduct.moq) return

    const newItem: CartItem = {
      product: selectedProduct,
      quantity: selectedQuantity,
      selectedOptions: { ...selectedOptions },
    }

    setCart([...cart, newItem])
    handleCloseProductModal()
    setIsCartOpen(true)
  }

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    const item = cart[index]
    if (!item) return

    const newQuantity = Math.max(item.product.moq, quantity)
    const updatedCart = [...cart]
    updatedCart[index] = { ...item, quantity: newQuantity }
    setCart(updatedCart)
  }

  const getItemPrice = (item: CartItem) => {
    const basePrice = item.product.price
    const optionsPrice = item.product.customizationOptions
      .filter((option) => item.selectedOptions[option.id])
      .reduce((total, option) => total + option.price, 0)
    return basePrice + optionsPrice
  }

  const totalCartAmount = cart.reduce((total, item) => {
    return total + getItemPrice(item) * item.quantity
  }, 0)

  const handleSendPDF = () => {
    if (cart.length === 0) return
    setShowEmailDialog(true)
  }

  const handleSubmitEmail = async () => {
    if (!email) return

    try {
      const quoteData = {
        email,
        shareLink: window.location.href,
        catalogueName: catalogue.name,
        totalAmount: totalCartAmount,
        pdfUrl: `/api/generate-pdf/${catalogue.id}`,
        items: cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: getItemPrice(item),
          customization:
            item.product.customizationOptions
              .filter((option) => item.selectedOptions[option.id])
              .map((option) => option.label)
              .join(", ") || undefined,
        })),
      }

      const response = await fetch("/api/quote-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      })

      if (response.ok) {
        alert(`PDF quote has been sent to ${email}`)
        setShowEmailDialog(false)
        setIsCartOpen(false)
        setCart([])
      } else {
        alert("Failed to send PDF. Please try again.")
      }
    } catch (error) {
      console.error("Error sending PDF:", error)
      alert("Failed to send PDF. Please try again.")
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-[50px]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-[50px] w-auto" />
          </div>
          <div className="text-lg font-medium">{catalogue.name}</div>
          <Button variant="outline" size="icon" className="relative" onClick={() => setIsCartOpen(!isCartOpen)}>
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8 flex justify-center items-center">
        <div className="max-w-6xl w-full flex justify-center">
          <div className="relative w-full max-w-4xl rounded-lg overflow-hidden border" style={{ aspectRatio: "16/9" }}>
            {currentSlide && (
              <>
                <img
                  src={currentSlide.imageUrl || "/placeholder.svg"}
                  alt={`Slide ${currentSlideIndex + 1}`}
                  className="w-full h-full object-contain bg-gray-50"
                />

                {currentSlide.hotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    className="absolute w-6 h-6 rounded-full bg-primary/80 animate-pulse -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:bg-primary transition-colors"
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={() => handleHotspotClick(hotspot)}
                  />
                ))}

                <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/80 pointer-events-auto"
                    onClick={handlePrevSlide}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/80 pointer-events-auto"
                    onClick={handleNextSlide}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {catalogue.slides.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentSlideIndex ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      onClick={() => setCurrentSlideIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Product Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && handleCloseProductModal()}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row h-[80vh]">
              {/* Left side - Mini gallery (40% width) */}
              <div className="w-full md:w-[40%] bg-muted">
                <div className="relative" style={{ aspectRatio: "1/1" }}>
                  <img
                    src={selectedProduct.images?.[selectedImageIndex] || "/placeholder.svg"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex p-2 gap-2 overflow-x-auto">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        className={`w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                          selectedImageIndex === idx ? "border-primary" : "border-transparent"
                        }`}
                        onClick={() => setSelectedImageIndex(idx)}
                      >
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`${selectedProduct.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side - Product details (60% width) */}
              <div className="w-full md:w-[60%] p-6 flex flex-col overflow-y-auto">
                <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                  <span>Price per unit (VAT Ex) ₱{getTotalPrice().toFixed(2)}</span>
                  <span>|</span>
                  <span>MOQ {selectedProduct.moq} units</span>
                </div>

                {/* Specifications */}
                {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Specifications</h3>
                    <ul className="text-sm space-y-1">
                      {selectedProduct.specifications.map((spec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Inclusions */}
                {selectedProduct.inclusions && selectedProduct.inclusions.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Inclusions</h3>
                    <ul className="text-sm space-y-1">
                      {selectedProduct.inclusions.map((inclusion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{inclusion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lead Time - Non-Peak above Peak */}
                {(selectedProduct.leadTime?.peak || selectedProduct.leadTime?.nonPeak) && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">\
