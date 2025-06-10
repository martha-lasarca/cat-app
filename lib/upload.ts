import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadFile(file: File, folder = "slides") {
  try {
    // Check if token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not configured")
    }

    // Generate a unique filename
    const filename = `${folder}/${nanoid()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`

    // Upload to Vercel Blob Storage with explicit token
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Return the URL of the uploaded file
    return blob.url
  } catch (error) {
    console.error("Upload error:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`)
  }
}
