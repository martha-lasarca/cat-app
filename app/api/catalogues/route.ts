import { type NextRequest, NextResponse } from "next/server"
import { getCatalogues, createCatalogue } from "@/lib/db"

export async function GET() {
  try {
    const catalogues = await getCatalogues()
    return NextResponse.json(catalogues)
  } catch (error) {
    console.error("Error in GET /api/catalogues:", error)

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      return NextResponse.json(
        {
          error: "Database tables not found. Please run the Supabase schema setup.",
          details: "Execute the SQL commands in scripts/supabase-schema.sql in your Supabase dashboard.",
        },
        { status: 500 },
      )
    }

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
    return NextResponse.json(
      {
        error: "Failed to create catalogue",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
