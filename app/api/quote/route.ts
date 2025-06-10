import { type NextRequest, NextResponse } from "next/server"
import { addQuoteLogEntry } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, shareLink, catalogueName, totalAmount, items } = body

    if (!email || !shareLink || !catalogueName || !totalAmount || !items) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate a simple PDF URL (you can implement actual PDF generation later)
    const pdfUrl = `/api/generate-pdf/${Date.now()}`

    const quoteEntry = await addQuoteLogEntry({
      email,
      shareLink,
      catalogueName,
      totalAmount,
      pdfUrl,
      items,
    })

    // Here you would typically send an email with the PDF
    // For now, we'll just log the quote

    return NextResponse.json({
      success: true,
      message: `Quote sent to ${email}`,
      quoteId: quoteEntry.id,
    })
  } catch (error) {
    console.error("Error in POST /api/quote:", error)
    return NextResponse.json({ error: "Failed to process quote request" }, { status: 500 })
  }
}
