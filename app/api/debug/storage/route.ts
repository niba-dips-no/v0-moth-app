import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Create a Supabase client with service role (bypasses RLS completely)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET() {
  try {
    console.log("Fetching storage debug info...")

    // Get buckets using admin client
    const { data: bucketsData, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return NextResponse.json(
        {
          error: "Failed to list buckets",
          details: bucketsError.message,
        },
        { status: 500 },
      )
    }

    console.log(
      "Found buckets:",
      bucketsData?.map((b) => b.name),
    )

    // Get files from observations bucket if it exists
    let filesData = []
    const observationsBucket = bucketsData?.find((b) => b.name === "observations")

    if (observationsBucket) {
      const { data: files, error: filesError } = await supabaseAdmin.storage.from("observations").list("public", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      })

      if (filesError) {
        console.error("Error listing files:", filesError)
        // Don't fail the whole request, just log the error
        filesData = []
      } else {
        filesData = files || []
      }
    }

    // Get storage usage stats
    let storageStats = null
    try {
      // Try to get some basic stats about the storage
      const totalFiles = filesData.length
      const totalSize = filesData.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)

      storageStats = {
        totalFiles,
        totalSize,
        formattedSize: `${Math.round(totalSize / 1024)} KB`,
      }
    } catch (statsError) {
      console.error("Error calculating storage stats:", statsError)
    }

    return NextResponse.json({
      success: true,
      buckets: bucketsData || [],
      files: filesData,
      stats: storageStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Storage debug error:", error)
    return NextResponse.json(
      {
        error: "Storage debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
