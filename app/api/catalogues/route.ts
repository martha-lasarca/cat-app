import { type NextRequest, NextResponse } from "next/server"
import { getCatalogues, createCatalogue } from "@/lib/db"

export async function GET() {
  try {
    const catalogues = await getCatalogues()
    return NextResponse.json(catalogues)
  } catch (error) {
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

    console.log("Creating catalogue:", { name, slug })

    const catalogue = await createCatalogue({
      name,
      slug,
      slides: [],
      products: [],
    })

    console.log("Catalogue created successfully:", catalogue.id)

    return NextResponse.json(catalogue, { status: 201 })
  } catch (error) {
    console.error("Error creating catalogue:", error)
    return NextResponse.json(
      {
        error: "Failed to create catalogue",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
