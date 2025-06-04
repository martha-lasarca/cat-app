import { type NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/upload"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as "slides" | "products") || "slides"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const url = await uploadFile(file, folder)
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
