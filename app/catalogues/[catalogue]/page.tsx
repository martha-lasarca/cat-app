"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, X } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  moq: number
  description: string
}

interface CartItem {
  product: Product
  quantity: number
}

interface Hotspot {
  id: string
  x: number
  y: number
  productId: string
}

interface Slide {
  id: string
  imageUrl: string
  hotspots: Hotspot[]
}

export default function CataloguePage() {
  const params = useParams()
  const catalogueName = params.catalogue as string

  const [slides, setSlides] = useState<Slide[]>([
    {
      id: "1",
      imageUrl: "/placeholder.svg?height=600&width=800",
      hotspots: [
        { id: "1", x: 30, y: 40, productId: "1" },
        { id: "2", x: 70, y: 60, productId: "2" },
      ],
    },
    {
      id: "2",
      imageUrl: "/placeholder.svg?height=600&width=800",
      hotspots: [{ id: "3", x: 50, y: 50, productId: "3" }],
    },
  ])

  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Premium T-Shirt",
      price: 599.99,
      moq: 50,
      description: "High-quality cotton t-shirt with custom printing options.",
    },
    {
      id: "2",
      name: "Denim Jeans",
      price: 1299.99,
      moq: 25,
      description: "Classic denim jeans with modern fit and premium fabric.",
    },
    {
      id: "3",
      name: "Casual Hoodie",
      price: 899.99,
      moq: 30,
      description: "Comfortable hoodie perfect for casual wear and branding.",
    },
  ])

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const currentSlide = slides[currentSlideIndex]

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const handleHotspotClick = (hotspotId: string) => {
    const hotspot = currentSlide.hotspots.find((h) => h.id === hotspotId)
    if (!hotspot) return

    const product = products.find((p) => p.id === hotspot.productId)
    if (!product) return

    setSelectedProduct(product)
    setSelectedQuantity(product.moq)
  }

  const handleCloseProductModal = () => {
    setSelectedProduct(null)
    setSelectedQuantity(0)
  }

  const handleQuantityChange = (value: number) => {
    if (!selectedProduct) return

    const newQuantity = Math.max(selectedProduct.moq, value)
    setSelectedQuantity(newQuantity)
  }

  const handleAddToCart = () => {
    if (!selectedProduct || selectedQuantity < selectedProduct.moq) return

    const existingItemIndex = cart.findIndex((item) => item.product.id === selectedProduct.id)

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += selectedQuantity
      setCart(updatedCart)
    } else {
      setCart([...cart, { product: selectedProduct, quantity: selectedQuantity }])
    }

    handleCloseProductModal()
    setIsCartOpen(true)
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const newQuantity = Math.max(product.moq, quantity)

    setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item)))
  }

  const totalCartAmount = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">
            {catalogueName.charAt(0).toUpperCase() + catalogueName.slice(1)} Catalogue
          </h1>
          <Button variant="outline" size="icon" className="relative" onClick={() => setIsCartOpen(!isCartOpen)}>
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="relative aspect-[4/3] max-h-[70vh] rounded-lg overflow-hidden border">
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
              onClick={() => handleHotspotClick(hotspot.id)}
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
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentSlideIndex ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                onClick={() => setCurrentSlideIndex(index)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Product Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && handleCloseProductModal()}>
        <DialogContent className="sm:max-w-md">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                <DialogDescription>{selectedProduct.description}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Price:</span>
                  <span>₱{selectedProduct.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">MOQ:</span>
                  <span>{selectedProduct.moq} units</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(selectedQuantity - 1)}
                      disabled={selectedQuantity <= selectedProduct.moq}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={selectedQuantity}
                      onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value))}
                      className="w-20 h-8 text-center"
                      min={selectedProduct.moq}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(selectedQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span>₱{(selectedProduct.price * selectedQuantity).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddToCart}>Add to Cart</Button>
              </div>
            </>
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
            <h2 className="text-xl font-bold">Your Cart</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">Click on the hotspots to add products to your cart</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.product.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">₱{item.product.price.toFixed(2)} per unit</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateCartQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= item.product.moq}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateCartQuantity(item.product.id, Number.parseInt(e.target.value))}
                            className="w-20 h-8 text-center"
                            min={item.product.moq}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateCartQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="font-medium">₱{(item.product.price * item.quantity).toFixed(2)}</span>
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
            <Button className="w-full" disabled={cart.length === 0}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
