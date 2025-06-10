// Database implementation that works in both development and production
// Uses environment variables to store data in production, JSON files in development

import fs from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const IS_PRODUCTION = process.env.NODE_ENV === "production"

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

// In-memory storage for production (will reset on each deployment)
let cataloguesCache: Catalogue[] = []
let quoteLogCache: QuoteLogEntry[] = []
let cacheInitialized = false

// Initialize cache from environment variables in production
async function initializeCache() {
  if (cacheInitialized) return

  if (IS_PRODUCTION) {
    try {
      // Try to load from environment variables (you can set these in Vercel dashboard)
      const cataloguesData = process.env.CATALOGUES_DATA
      const quoteLogData = process.env.QUOTE_LOG_DATA

      if (cataloguesData) {
        cataloguesCache = JSON.parse(cataloguesData)
      }

      if (quoteLogData) {
        quoteLogCache = JSON.parse(quoteLogData)
      }
    } catch (error) {
      console.log("No existing data found in environment variables, starting fresh")
    }
  }

  cacheInitialized = true
}

// Ensure data directory exists (development only)
async function ensureDataDir() {
  if (IS_PRODUCTION) return

  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Catalogues CRUD
export async function getCatalogues(): Promise<Catalogue[]> {
  await initializeCache()

  if (IS_PRODUCTION) {
    return cataloguesCache
  }

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

export async function getCatalogueByCustomLink(customLink: string): Promise<Catalogue | null> {
  const catalogues = await getCatalogues()
  return catalogues.find((c) => c.customLink === customLink) || null
}

export async function saveCatalogues(catalogues: Catalogue[]): Promise<void> {
  if (IS_PRODUCTION) {
    cataloguesCache = catalogues
    // In production, data will be lost on restart unless you implement persistent storage
    console.log("Data saved to memory cache (will be lost on restart)")
    return
  }

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
  await initializeCache()

  if (IS_PRODUCTION) {
    return quoteLogCache
  }

  await ensureDataDir()
  try {
    const data = await fs.readFile(path.join(DATA_DIR, "quote-log.json"), "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function saveQuoteLog(entries: QuoteLogEntry[]): Promise<void> {
  if (IS_PRODUCTION) {
    quoteLogCache = entries
    console.log("Quote log saved to memory cache (will be lost on restart)")
    return
  }

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
