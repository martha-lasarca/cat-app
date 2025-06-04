import { type NextRequest, NextResponse } from "next/server"
import { deleteQuoteLogEntry } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = await deleteQuoteLogEntry(params.id)

    if (!success) {
      return NextResponse.json({ error: "Quote log entry not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete quote log entry" }, { status: 500 })
  }
}
