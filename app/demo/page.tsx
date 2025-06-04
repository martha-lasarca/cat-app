"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  moq: number
  description: string
  customization?: {
    engraved: boolean
    printed: boolean
    engravedPrice: number
    printedPrice: number
  }
  images?: string[]
}

interface CartItem {
  product: Product
  quantity: number
  customizationType?: "engraved" | "printed" | null
}

interface Hotspot {
  id: string
  x: number
  y: number
  productId: string
  slideId: string
}

interface Slide {
  id: string
  imageUrl: string
  hotspots: Hotspot[]
}

export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to admin dashboard since demo mode is removed
    router.push("/admin/dashboard")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="mt-4">Redirecting...</p>
      </div>
    </div>
  )
}
