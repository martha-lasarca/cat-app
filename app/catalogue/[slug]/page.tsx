"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, ShoppingCart, X } from "lucide-react"
import { supabaseClient } from "@/lib/supabase"
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
  const clientParam = searchParams.get("client")

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
      // Fetch catalogue using Supabase client
      const { data, error } = await supabaseClient.from("catalogues").select("*").eq("slug", slug).single()

      if (error) {
        // Try by custom link if slug doesn't work
        const { data: customLinkData, error: customLinkError } = await supabaseClient
          .from("catalogues")
          .select("*")
          .eq("customLink", slug)
          .single()

        if (customLinkError) {
          console.error("Catalogue not found")
        } else {
          setCatalogue(customLinkData)
        }
      } else {
        setCatalogue(data)
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

      {/* Product Modal - Fixed layout with equal panels */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && handleCloseProductModal()}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row h-[80vh]">
              {/* Left side - Mini gallery (50% width) */}
              <div className="w-full md:w-[50%] bg-muted">
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

              {/* Right side - Product details (50% width) */}
              <div className="w-full md:w-[50%] p-6 flex flex-col overflow-y-auto">
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold break-words">{selectedProduct.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                      <span>Price per unit (VAT Ex) ₱{getTotalPrice().toFixed(2)}</span>
                      <span>|</span>
                      <span>MOQ {selectedProduct.moq} units</span>
                    </div>
                  </div>

                  {/* Specifications */}
                  {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Specifications</h3>
                      <ul className="text-sm space-y-1">
                        {selectedProduct.specifications.map((spec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 flex-shrink-0">•</span>
                            <span className="break-words">{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Inclusions */}
                  {selectedProduct.inclusions && selectedProduct.inclusions.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Inclusions</h3>
                      <ul className="text-sm space-y-1">
                        {selectedProduct.inclusions.map((inclusion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 flex-shrink-0">•</span>
                            <span className="break-words">{inclusion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lead Time - Non-Peak above Peak */}
                  {(selectedProduct.leadTime?.peak || selectedProduct.leadTime?.nonPeak) && (
                    <div>
                      <h3 className="font-medium mb-2">Lead Time</h3>
                      <div className="text-sm space-y-1">
                        {selectedProduct.leadTime.nonPeak && (
                          <div>
                            <span className="font-medium">Non-Peak:</span>{" "}
                            <span className="break-words">{selectedProduct.leadTime.nonPeak}</span>
                          </div>
                        )}
                        {selectedProduct.leadTime.peak && (
                          <div>
                            <span className="font-medium">Peak:</span>{" "}
                            <span className="break-words">{selectedProduct.leadTime.peak}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customization Options */}
                  {selectedProduct.customizationOptions && selectedProduct.customizationOptions.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Customization Options</h3>
                      <div className="space-y-2">
                        {selectedProduct.customizationOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={option.id}
                              className="h-4 w-4"
                              checked={selectedOptions[option.id] || false}
                              onChange={() => handleOptionToggle(option.id)}
                            />
                            <label htmlFor={option.id} className="text-sm break-words">
                              {option.label} (+₱{option.price.toFixed(2)})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity and Add to Quote - Fixed at bottom */}
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="quantity" className="font-medium">
                        QTY
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={selectedQuantity}
                        onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value || "0"))}
                        className="w-20 h-8 text-center"
                        min={selectedProduct.moq}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="font-bold">₱{(getTotalPrice() * selectedQuantity).toFixed(2)}</div>
                    </div>
                  </div>
                  <Button onClick={handleAddToCart} className="w-full" type="button">
                    Add to Quote
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Your Quote</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your quote is empty</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click on the hotspots to add products to your quote
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">₱{getItemPrice(item).toFixed(2)} per unit</p>
                          {item.product.customizationOptions.filter((option) => item.selectedOptions[option.id])
                            .length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Customization:{" "}
                              {item.product.customizationOptions
                                .filter((option) => item.selectedOptions[option.id])
                                .map((option) => option.label)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveFromCart(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">QTY</span>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateCartQuantity(index, Number.parseInt(e.target.value || "0"))}
                            className="w-20 h-8 text-center"
                            min={item.product.moq}
                          />
                        </div>
                        <span className="font-medium">₱{(getItemPrice(item) * item.quantity).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold">₱{totalCartAmount.toFixed(2)}</span>
            </div>
            <Button className="w-full" disabled={cart.length === 0} onClick={handleSendPDF}>
              Send PDF Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Enter Your Email</h2>
            <p className="text-sm text-muted-foreground">We'll send a PDF of your quote to this email address.</p>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitEmail}>Send PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
