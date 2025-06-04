import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadFile(file: File, folder = "slides") {
  try {
    // Generate a unique filename
    const filename = `${nanoid()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Return the URL of the uploaded file
    return blob.url
  } catch (error) {
    console.error("Upload error:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`)
  }
}
