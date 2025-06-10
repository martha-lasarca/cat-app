import { supabaseAdmin } from "./supabase"

export interface Catalogue {
  id: string
  name: string
  slug: string
  customLink?: string
  createdAt: string
  updatedAt: string
  slides: Slide[]
  products: Product[]
}

export interface Slide {
  id: string
  imageUrl: string
  hotspots: Hotspot[]
}

export interface Hotspot {
  id: string
  x: number
  y: number
  productId: string
  slideId: string
}

export interface CustomizationOption {
  id: string
  label: string
  price: number
}

export interface Product {
  id: string
  name: string
  price: number
  moq: number
  specifications: string[]
  inclusions: string[]
  leadTime: {
    peak: string
    nonPeak: string
  }
  images: string[]
  customizationOptions: CustomizationOption[]
}

export interface QuoteLogEntry {
  id: string
  email: string
  shareLink: string
  catalogueName: string
  totalAmount: number
  pdfUrl: string
  timestamp: string
  items: {
    name: string
    quantity: number
    price: number
    customization?: string
  }[]
}

// Catalogues CRUD
export async function getCatalogues(): Promise<Catalogue[]> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").order("updatedAt", { ascending: false })

  if (error) {
    console.error("Error fetching catalogues:", error)
    throw new Error("Failed to fetch catalogues")
  }

  return data || []
}

export async function getCatalogueById(id: string): Promise<Catalogue | null> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error fetching catalogue:", error)
    throw new Error("Failed to fetch catalogue")
  }

  return data
}

export async function getCatalogueBySlug(slug: string): Promise<Catalogue | null> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").eq("slug", slug).single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error fetching catalogue by slug:", error)
    throw new Error("Failed to fetch catalogue")
  }

  return data
}

export async function getCatalogueByCustomLink(customLink: string): Promise<Catalogue | null> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").eq("customLink", customLink).single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error fetching catalogue by custom link:", error)
    throw new Error("Failed to fetch catalogue")
  }

  return data
}

export async function createCatalogue(
  catalogue: Omit<Catalogue, "id" | "createdAt" | "updatedAt">,
): Promise<Catalogue> {
  const now = new Date().toISOString()
  const newCatalogue = {
    ...catalogue,
    createdAt: now,
    updatedAt: now,
  }

  const { data, error } = await supabaseAdmin.from("catalogues").insert([newCatalogue]).select().single()

  if (error) {
    console.error("Error creating catalogue:", error)
    throw new Error("Failed to create catalogue")
  }

  return data
}

export async function updateCatalogue(id: string, updates: Partial<Catalogue>): Promise<Catalogue | null> {
  const { data, error } = await supabaseAdmin
    .from("catalogues")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error updating catalogue:", error)
    throw new Error("Failed to update catalogue")
  }

  return data
}

export async function deleteCatalogue(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from("catalogues").delete().eq("id", id)

  if (error) {
    console.error("Error deleting catalogue:", error)
    throw new Error("Failed to delete catalogue")
  }

  return true
}

// Quote Log CRUD
export async function getQuoteLog(): Promise<QuoteLogEntry[]> {
  const { data, error } = await supabaseAdmin.from("quote_logs").select("*").order("timestamp", { ascending: false })

  if (error) {
    console.error("Error fetching quote log:", error)
    throw new Error("Failed to fetch quote log")
  }

  return data || []
}

export async function addQuoteLogEntry(entry: Omit<QuoteLogEntry, "id" | "timestamp">): Promise<QuoteLogEntry> {
  const newEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin.from("quote_logs").insert([newEntry]).select().single()

  if (error) {
    console.error("Error creating quote log entry:", error)
    throw new Error("Failed to create quote log entry")
  }

  return data
}

export async function deleteQuoteLogEntry(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from("quote_logs").delete().eq("id", id)

  if (error) {
    console.error("Error deleting quote log entry:", error)
    throw new Error("Failed to delete quote log entry")
  }

  return true
}
