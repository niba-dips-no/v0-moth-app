import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Create admin client with service role key
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Create regular client with anon key
const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET() {
  const startTime = Date.now()

  try {
    const result = {
      success: true,
      auth: false,
      storage: false,
      database: false,
      observationCount: 0,
      buckets: [],
      responseTime: 0,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      error: null as string | null,
    }

    // Test auth with regular client
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getSession()
      result.auth = !authError
    } catch (error) {
      console.error("Auth test error:", error)
      result.auth = false
    }

    // Test database with admin client (to get accurate count)
    try {
      const { count, error: dbError } = await supabaseAdmin
        .from("observations")
        .select("*", { count: "exact", head: true })

      result.database = !dbError
      result.observationCount = count || 0
    } catch (error) {
      console.error("Database test error:", error)
      result.database = false

      // Fallback: try with regular client
      try {
        const { data: fallbackData, error: fallbackError } = await supabaseClient
          .from("observations")
          .select("id")
          .limit(1)

        result.database = !fallbackError
      } catch (fallbackErr) {
        result.database = false
      }
    }

    // Test storage with admin client (to list buckets)
    try {
      const { data: bucketData, error: storageError } = await supabaseAdmin.storage.listBuckets()

      result.storage = !storageError

      if (bucketData) {
        // Get file counts for each bucket
        const bucketsWithCounts = await Promise.all(
          bucketData.map(async (bucket) => {
            try {
              const { data: files, error: filesError } = await supabaseAdmin.storage
                .from(bucket.name)
                .list("", { limit: 1000 })

              return {
                name: bucket.name,
                public: bucket.public || false,
                file_count: filesError ? 0 : files?.length || 0,
                id: bucket.id,
                created_at: bucket.created_at,
              }
            } catch (error) {
              return {
                name: bucket.name,
                public: bucket.public || false,
                file_count: 0,
                id: bucket.id,
                created_at: bucket.created_at,
              }
            }
          }),
        )

        result.buckets = bucketsWithCounts
      }
    } catch (error) {
      console.error("Storage test error:", error)
      result.storage = false

      // Fallback: try with regular client
      try {
        const { data: fallbackBuckets, error: fallbackError } = await supabaseClient.storage.listBuckets()
        result.storage = !fallbackError
        result.buckets =
          fallbackBuckets?.map((bucket) => ({
            name: bucket.name,
            public: bucket.public || false,
            file_count: 0, // Can't get count with anon key
            id: bucket.id,
            created_at: bucket.created_at,
          })) || []
      } catch (fallbackErr) {
        result.storage = false
      }
    }

    result.responseTime = Date.now() - startTime

    return NextResponse.json(result)
  } catch (error) {
    console.error("Supabase debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      },
      { status: 500 },
    )
  }
}
