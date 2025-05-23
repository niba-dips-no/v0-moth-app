import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Create a Supabase client with service role (bypasses RLS completely)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses all RLS policies
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function POST(request: NextRequest) {
  try {
    console.log("Starting server-side upload...")

    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const comment = formData.get("comment") as string
    const latitude = Number.parseFloat(formData.get("latitude") as string)
    const longitude = Number.parseFloat(formData.get("longitude") as string)
    const accuracy = formData.get("accuracy") ? Number.parseFloat(formData.get("accuracy") as string) : null
    const deviceInfo = JSON.parse(formData.get("deviceInfo") as string)
    const timestamp = formData.get("timestamp") as string

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    console.log("Received file:", imageFile.name, "Size:", imageFile.size, "Type:", imageFile.type)

    // Generate unique filename
    const fileName = `${uuidv4()}.jpg`
    const filePath = `public/${fileName}`

    console.log("Uploading to path:", filePath)

    // Convert file to array buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Check if bucket exists, create if it doesn't (using admin client)
    try {
      console.log("Checking if bucket exists...")
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError)
        return NextResponse.json({ error: "Storage service unavailable" }, { status: 500 })
      }

      const observationsBucketExists = buckets?.some((bucket) => bucket.name === "observations")

      if (!observationsBucketExists) {
        console.log("Creating observations bucket...")
        const { error: createBucketError } = await supabaseAdmin.storage.createBucket("observations", {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          fileSizeLimit: 10485760, // 10MB
        })

        if (createBucketError) {
          console.error("Error creating bucket:", createBucketError)
          // Continue anyway - bucket might exist but not be visible to this user
          console.log("Continuing despite bucket creation error...")
        } else {
          console.log("Bucket created successfully")
        }
      }
    } catch (bucketError) {
      console.error("Bucket check/creation error:", bucketError)
      // Continue anyway - we'll try to upload regardless
      console.log("Continuing despite bucket error...")
    }

    // Upload using service role (bypasses ALL RLS policies)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("observations")
      .upload(filePath, uint8Array, {
        contentType: imageFile.type || "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    console.log(`Upload successful: ${uploadData.path}`)

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage.from("observations").getPublicUrl(filePath)

    const imageUrl = urlData.publicUrl
    console.log(`Public URL: ${imageUrl}`)

    // Insert observation record using admin client (bypasses RLS)
    const { data: observation, error: dbError } = await supabaseAdmin
      .from("observations")
      .insert({
        image_url: imageUrl,
        comment: comment || "",
        created_at: timestamp,
        latitude: latitude || 0,
        longitude: longitude || 0,
        accuracy: accuracy,
        device_info: deviceInfo,
        status: "Pending",
        user_id: null, // Anonymous submission
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 })
    }

    console.log("Observation saved successfully:", observation.id)

    return NextResponse.json({
      success: true,
      id: observation.id,
      imageUrl: imageUrl,
    })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    )
  }
}
