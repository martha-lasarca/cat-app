import { type NextRequest, NextResponse } from "next/server"
import { getCatalogueByCustomLink } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { link: string } }) {
  try {
    const catalogue = await getCatalogueByCustomLink(params.link)

    if (!catalogue) {
      return NextResponse.json({ error: "Catalogue not found" }, { status: 404 })
    }

    return NextResponse.json(catalogue)
  } catch (error) {
    console.error("Error fetching catalogue by custom link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
