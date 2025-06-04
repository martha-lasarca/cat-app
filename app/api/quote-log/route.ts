import { type NextRequest, NextResponse } from "next/server"
import { getQuoteLog, addQuoteLogEntry } from "@/lib/db"

export async function GET() {
  try {
    const entries = await getQuoteLog()
    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quote log" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const entry = await addQuoteLogEntry(body)
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create quote log entry" }, { status: 500 })
  }
}
