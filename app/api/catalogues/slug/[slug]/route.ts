import { type NextRequest, NextResponse } from "next/server"
import { getCatalogueBySlug } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const catalogue = await getCatalogueBySlug(params.slug)
    if (!catalogue) {
      return NextResponse.json({ error: "Catalogue not found" }, { status: 404 })
    }
    return NextResponse.json(catalogue)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch catalogue" }, { status: 500 })
  }
}
