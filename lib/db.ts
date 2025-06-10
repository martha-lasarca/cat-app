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

// Transform database row to Catalogue interface
function transformCatalogueFromDB(row: any): Catalogue {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    customLink: row.custom_link || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slides: row.slides || [],
    products: row.products || [],
  }
}

// Transform Catalogue to database format
function transformCatalogueForDB(catalogue: Partial<Catalogue>): any {
  return {
    id: catalogue.id,
    name: catalogue.name,
    slug: catalogue.slug,
    custom_link: catalogue.customLink || null,
    created_at: catalogue.createdAt,
    updated_at: catalogue.updatedAt,
    slides: catalogue.slides || [],
    products: catalogue.products || [],
  }
}

// Catalogues CRUD
export async function getCatalogues(): Promise<Catalogue[]> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching catalogues:", error)
    throw new Error("Failed to fetch catalogues")
  }

  return (data || []).map(transformCatalogueFromDB)
}

export async function getCatalogueById(id: string): Promise<Catalogue | null> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error fetching catalogue:", error)
    throw new Error("Failed to fetch catalogue")
  }

  return transformCatalogueFromDB(data)
}

export async function getCatalogueBySlug(slug: string): Promise<Catalogue | null> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").eq("slug", slug).single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error fetching catalogue by slug:", error)
    throw new Error("Failed to fetch catalogue")
  }

  return transformCatalogueFromDB(data)
}

export async function getCatalogueByCustomLink(customLink: string): Promise<Catalogue | null> {
  const { data, error } = await supabaseAdmin.from("catalogues").select("*").eq("custom_link", customLink).single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error fetching catalogue by custom link:", error)
    throw new Error("Failed to fetch catalogue")
  }

  return transformCatalogueFromDB(data)
}

export async function createCatalogue(
  catalogue: Omit<Catalogue, "id" | "createdAt" | "updatedAt">,
): Promise<Catalogue> {
  const now = new Date().toISOString()
  const newCatalogue = {
    ...catalogue,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  const { data, error } = await supabaseAdmin
    .from("catalogues")
    .insert([transformCatalogueForDB(newCatalogue)])
    .select()
    .single()

  if (error) {
    console.error("Error creating catalogue:", error)
    throw new Error("Failed to create catalogue")
  }

  return transformCatalogueFromDB(data)
}

export async function updateCatalogue(id: string, updates: Partial<Catalogue>): Promise<Catalogue | null> {
  const updateData = {
    ...transformCatalogueForDB(updates),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin.from("catalogues").update(updateData).eq("id", id).select().single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    console.error("Error updating catalogue:", error)
    throw new Error("Failed to update catalogue")
  }

  return transformCatalogueFromDB(data)
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

  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    shareLink: row.share_link,
    catalogueName: row.catalogue_name,
    totalAmount: row.total_amount,
    pdfUrl: row.pdf_url,
    timestamp: row.timestamp,
    items: row.items || [],
  }))
}

export async function addQuoteLogEntry(entry: Omit<QuoteLogEntry, "id" | "timestamp">): Promise<QuoteLogEntry> {
  const newEntry = {
    id: crypto.randomUUID(),
    email: entry.email,
    share_link: entry.shareLink,
    catalogue_name: entry.catalogueName,
    total_amount: entry.totalAmount,
    pdf_url: entry.pdfUrl,
    timestamp: new Date().toISOString(),
    items: entry.items,
  }

  const { data, error } = await supabaseAdmin.from("quote_logs").insert([newEntry]).select().single()

  if (error) {
    console.error("Error creating quote log entry:", error)
    throw new Error("Failed to create quote log entry")
  }

  return {
    id: data.id,
    email: data.email,
    shareLink: data.share_link,
    catalogueName: data.catalogue_name,
    totalAmount: data.total_amount,
    pdfUrl: data.pdf_url,
    timestamp: data.timestamp,
    items: data.items || [],
  }
}

export async function deleteQuoteLogEntry(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from("quote_logs").delete().eq("id", id)

  if (error) {
    console.error("Error deleting quote log entry:", error)
    throw new Error("Failed to delete quote log entry")
  }

  return true
}
