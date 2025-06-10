import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadFile(file: File, folder = "slides"): Promise<string> {
  try {
    // Check if token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not configured")
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop() || "jpg"
    const filename = `${folder}/${nanoid()}.${fileExtension}`

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return blob.url
  } catch (error) {
    console.error("Upload error:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`)
  }
}
