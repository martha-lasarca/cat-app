import { supabaseAdmin } from "../lib/supabase.js"

async function initializeDatabase() {
  console.log("Initializing database...")

  try {
    // Test connection
    const { data, error } = await supabaseAdmin.from("catalogues").select("count", { count: "exact" })

    if (error) {
      console.error("Database connection failed:", error.message)
      console.log("Please ensure you have:")
      console.log("1. Created the Supabase tables using the schema in scripts/supabase-schema.sql")
      console.log("2. Set the correct environment variables:")
      console.log("   - NEXT_PUBLIC_SUPABASE_URL")
      console.log("   - NEXT_PUBLIC_SUPABASE_ANON_KEY")
      console.log("   - SUPABASE_SERVICE_ROLE_KEY")
      return
    }

    console.log("✅ Database connection successful!")
    console.log(`Found ${data?.[0]?.count || 0} catalogues in database`)

    // Create a sample catalogue if none exist
    if (!data?.[0]?.count) {
      console.log("Creating sample catalogue...")

      const sampleCatalogue = {
        name: "Sample Catalogue",
        slug: "sample-catalogue",
        slides: [
          {
            id: "1",
            imageUrl: "/placeholder.svg?height=600&width=800",
            hotspots: [],
          },
        ],
        products: [
          {
            id: "1",
            name: "Sample Product",
            price: 299.99,
            moq: 10,
            specifications: ["High quality material", "Durable construction"],
            inclusions: ["Product", "Packaging", "Documentation"],
            leadTime: {
              peak: "15-20 business days",
              nonPeak: "7-10 business days",
            },
            images: ["/placeholder.svg?height=400&width=400"],
            customizationOptions: [],
          },
        ],
      }

      const { data: newCatalogue, error: insertError } = await supabaseAdmin
        .from("catalogues")
        .insert([
          {
            name: sampleCatalogue.name,
            slug: sampleCatalogue.slug,
            slides: sampleCatalogue.slides,
            products: sampleCatalogue.products,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Failed to create sample catalogue:", insertError)
      } else {
        console.log("✅ Sample catalogue created successfully!")
      }
    }
  } catch (error) {
    console.error("Database initialization failed:", error)
  }
}

initializeDatabase()
