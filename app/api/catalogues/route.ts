import { type NextRequest, NextResponse } from "next/server"
import { getCatalogues, createCatalogue } from "@/lib/db"

export async function GET() {
  try {
    const catalogues = await getCatalogues()
    return NextResponse.json(catalogues)
  } catch (error) {
    console.error("Error in GET /api/catalogues:", error)
    return NextResponse.json({ error: "Failed to fetch catalogues" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const catalogue = await createCatalogue({
      name,
      slug,
      slides: [],
      products: [],
    })

    return NextResponse.json(catalogue, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/catalogues:", error)
    return NextResponse.json({ error: "Failed to create catalogue" }, { status: 500 })
  }
}
