import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: "Catalogue Hub API is running",
  })
}
