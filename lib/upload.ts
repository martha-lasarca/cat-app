import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadFile(file: File, folder: "slides" | "products" = "slides"): Promise<string> {
  try {
    // Check if token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not configured")
    }

    // Validate file
    if (!file || file.size === 0) {
      throw new Error("Invalid file provided")
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size too large. Maximum size is 10MB.")
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed")
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop() || "jpg"
    const filename = `${folder}/${nanoid()}-${Date.now()}.${fileExtension}`

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return blob.url
  } catch (error) {
    console.error("Upload error:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`)
  }
}
