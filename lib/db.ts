// Simple JSON file-based database for Vercel deployment
// In production, you'd want to use a proper database like Supabase or PostgreSQL

import fs from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

export interface Catalogue {
  id: string
  name: string
  slug: string
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

export interface Product {
  id: string
  name: string
  price: number
  moq: number
  description: string
  images: string[]
  customization: {
    engraved: boolean
    printed: boolean
    engravedPrice: number
    printedPrice: number
  }
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

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Catalogues CRUD
export async function getCatalogues(): Promise<Catalogue[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(path.join(DATA_DIR, "catalogues.json"), "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function getCatalogueById(id: string): Promise<Catalogue | null> {
  const catalogues = await getCatalogues()
  return catalogues.find((c) => c.id === id) || null
}

export async function getCatalogueBySlug(slug: string): Promise<Catalogue | null> {
  const catalogues = await getCatalogues()
  return catalogues.find((c) => c.slug === slug) || null
}

export async function saveCatalogues(catalogues: Catalogue[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(path.join(DATA_DIR, "catalogues.json"), JSON.stringify(catalogues, null, 2))
}

export async function createCatalogue(
  catalogue: Omit<Catalogue, "id" | "createdAt" | "updatedAt">,
): Promise<Catalogue> {
  const catalogues = await getCatalogues()
  const newCatalogue: Catalogue = {
    ...catalogue,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  catalogues.push(newCatalogue)
  await saveCatalogues(catalogues)
  return newCatalogue
}

export async function updateCatalogue(id: string, updates: Partial<Catalogue>): Promise<Catalogue | null> {
  const catalogues = await getCatalogues()
  const index = catalogues.findIndex((c) => c.id === id)
  if (index === -1) return null

  catalogues[index] = {
    ...catalogues[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  await saveCatalogues(catalogues)
  return catalogues[index]
}

export async function deleteCatalogue(id: string): Promise<boolean> {
  const catalogues = await getCatalogues()
  const filteredCatalogues = catalogues.filter((c) => c.id !== id)
  if (filteredCatalogues.length === catalogues.length) return false

  await saveCatalogues(filteredCatalogues)
  return true
}

// Quote Log CRUD
export async function getQuoteLog(): Promise<QuoteLogEntry[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(path.join(DATA_DIR, "quote-log.json"), "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function saveQuoteLog(entries: QuoteLogEntry[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(path.join(DATA_DIR, "quote-log.json"), JSON.stringify(entries, null, 2))
}

export async function addQuoteLogEntry(entry: Omit<QuoteLogEntry, "id" | "timestamp">): Promise<QuoteLogEntry> {
  const entries = await getQuoteLog()
  const newEntry: QuoteLogEntry = {
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  }
  entries.push(newEntry)
  await saveQuoteLog(entries)
  return newEntry
}

export async function deleteQuoteLogEntry(id: string): Promise<boolean> {
  const entries = await getQuoteLog()
  const filteredEntries = entries.filter((e) => e.id !== id)
  if (filteredEntries.length === entries.length) return false

  await saveQuoteLog(filteredEntries)
  return true
}
