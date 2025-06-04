"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, ShoppingCart, X } from "lucide-react"
import type { Catalogue, Product, Hotspot } from "@/lib/db"

interface CartItem {
  product: Product
  quantity: number
  customizationType?: "engraved" | "printed" | null
}

export default function PublicCataloguePage() {
  const params = useParams()
  const slug = params.slug as string

  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(0)
  const [selectedCustomization, setSelectedCustomization] = useState<"engraved" | "printed" | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [email, setEmail] = useState("")

  useEffect(() => {
    fetchCatalogue()
  }, [slug])

  const fetchCatalogue = async () => {
    try {
      const response = await fetch(`/api/catalogues/slug/${slug}`)
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
    const product = catalogue.products.find((p) => p.id === hotspot.productId)
    if (!product) return

    setSelectedProduct(product)
    setSelectedQuantity(product.moq)
    setSelectedImageIndex(0)
    setSelectedCustomization(null)
  }

  const handleCloseProductModal = () => {
    setSelectedProduct(null)
    setSelectedQuantity(0)
    setSelectedCustomization(null)
  }

  const handleQuantityChange = (value: number) => {
    if (!selectedProduct) return
    const newQuantity = Math.max(selectedProduct.moq, value)
    setSelectedQuantity(newQuantity)
  }

  const handleAddToCart = () => {
    if (!selectedProduct || selectedQuantity < selectedProduct.moq) return

    const newItem: CartItem = {
      product: selectedProduct,
      quantity: selectedQuantity,
      customizationType: selectedCustomization,
    }

    const existingItemIndex = cart.findIndex(
      (item) => item.product.id === selectedProduct.id && item.customizationType === selectedCustomization,
    )

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += selectedQuantity
      setCart(updatedCart)
    } else {
      setCart([...cart, newItem])
    }

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
    let additionalPrice = 0

    if (item.customizationType === "engraved" && item.product.customization?.engraved) {
      additionalPrice = item.product.customization.engravedPrice
    } else if (item.customizationType === "printed" && item.product.customization?.printed) {
      additionalPrice = item.product.customization.printedPrice
    }

    return basePrice + additionalPrice
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
      // Create quote log entry
      const quoteData = {
        email,
        shareLink: window.location.href,
        catalogueName: catalogue.name,
        totalAmount: totalCartAmount,
        pdfUrl: `/api/generate-pdf/${catalogue.id}`, // This would be implemented separately
        items: cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: getItemPrice(item),
          customization: item.customizationType || undefined,
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
        <div className="max-w-4xl w-full flex justify-center">
          <div className="relative aspect-[4/3] max-h-[70vh] rounded-lg overflow-hidden border w-full">
            {currentSlide && (
              <>
                <img
                  src={currentSlide.imageUrl || "/placeholder.svg"}
                  alt={`Slide ${currentSlideIndex + 1}`}
                  className="w-full h-full object-contain"
                />

                {currentSlide.hotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    className="absolute w-6 h-6 rounded-full bg-primary/80 animate-pulse -translate-x-1/2 -translate-y-1/2 cursor-pointer"
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
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row">
              {/* Left side - Mini gallery */}
              <div className="w-full md:w-1/2 bg-muted">
                <div className="relative aspect-square">
                  <img
                    src={selectedProduct.images?.[selectedImageIndex] || "/placeholder.svg"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex p-2 gap-2 overflow-x-auto">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
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

              {/* Right side - Product details */}
              <div className="w-full md:w-1/2 p-6 flex flex-col">
                <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                  <span>Price ₱{selectedProduct.price.toFixed(2)}</span>
                  <span>|</span>
                  <span>MOQ {selectedProduct.moq} units</span>
                </div>

                <p className="mt-4 text-sm">{selectedProduct.description}</p>

                {(selectedProduct.customization?.engraved || selectedProduct.customization?.printed) && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Customization Options</h3>
                    <div className="space-y-2">
                      {selectedProduct.customization?.engraved && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="engraved"
                            name="customization"
                            className="h-4 w-4"
                            checked={selectedCustomization === "engraved"}
                            onChange={() => setSelectedCustomization("engraved")}
                          />
                          <label htmlFor="engraved">
                            Engraved (+₱{selectedProduct.customization.engravedPrice.toFixed(2)})
                          </label>
                        </div>
                      )}
                      {selectedProduct.customization?.printed && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="printed"
                            name="customization"
                            className="h-4 w-4"
                            checked={selectedCustomization === "printed"}
                            onChange={() => setSelectedCustomization("printed")}
                          />
                          <label htmlFor="printed">
                            Printed (+₱{selectedProduct.customization.printedPrice.toFixed(2)})
                          </label>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="none"
                          name="customization"
                          className="h-4 w-4"
                          checked={selectedCustomization === null}
                          onChange={() => setSelectedCustomization(null)}
                        />
                        <label htmlFor="none">None</label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">QTY</span>
                    <Input
                      type="number"
                      value={selectedQuantity}
                      onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value || "0"))}
                      className="w-20 h-8 text-center"
                      min={selectedProduct.moq}
                    />
                  </div>
                  <Button onClick={handleAddToCart} type="button">
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
                          <p className="text-sm text-muted-foreground">
                            ₱{getItemPrice(item).toFixed(2)} per unit
                            {item.customizationType && (
                              <span className="ml-1">
                                ({item.customizationType === "engraved" ? "Engraved" : "Printed"})
                              </span>
                            )}
                          </p>
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
