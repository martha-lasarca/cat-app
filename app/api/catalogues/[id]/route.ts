import { type NextRequest, NextResponse } from "next/server"
import { getCatalogueById, updateCatalogue, deleteCatalogue } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const catalogue = await getCatalogueById(params.id)
    if (!catalogue) {
      return NextResponse.json({ error: "Catalogue not found" }, { status: 404 })
    }
    return NextResponse.json(catalogue)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch catalogue" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const catalogue = await updateCatalogue(params.id, body)

    if (!catalogue) {
      return NextResponse.json({ error: "Catalogue not found" }, { status: 404 })
    }

    return NextResponse.json(catalogue)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update catalogue" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = await deleteCatalogue(params.id)

    if (!success) {
      return NextResponse.json({ error: "Catalogue not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete catalogue" }, { status: 500 })
  }
}
