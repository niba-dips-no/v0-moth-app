import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { validateImageFile, validateObservationData, sanitizeInput } from "@/lib/validation"

// Create a Supabase client with service role (bypasses RLS completely)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log("Starting server-side upload with validation...")

    // Parse form data
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const comment = formData.get("comment") as string
    const latitudeStr = formData.get("latitude") as string
    const longitudeStr = formData.get("longitude") as string
    const accuracyStr = formData.get("accuracy") as string
    const deviceInfoStr = formData.get("deviceInfo") as string
    const timestamp = formData.get("timestamp") as string

    // Validate required fields
    if (!imageFile) {
      return NextResponse.json(
        {
          error: "No image file provided",
          code: "MISSING_IMAGE",
        },
        { status: 400 },
      )
    }

    if (!latitudeStr || !longitudeStr) {
      return NextResponse.json(
        {
          error: "Location data is required",
          code: "MISSING_LOCATION",
        },
        { status: 400 },
      )
    }

    // Parse and validate numeric values
    const latitude = Number.parseFloat(latitudeStr)
    const longitude = Number.parseFloat(longitudeStr)
    const accuracy = accuracyStr ? Number.parseFloat(accuracyStr) : null

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          error: "Invalid location coordinates",
          code: "INVALID_COORDINATES",
        },
        { status: 400 },
      )
    }

    // Validate image file
    const imageValidation = await validateImageFile(imageFile, {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      minWidth: 100,
      minHeight: 100,
    })

    if (!imageValidation.isValid) {
      return NextResponse.json(
        {
          error: "Image validation failed",
          details: imageValidation.errors,
          code: "INVALID_IMAGE",
        },
        { status: 400 },
      )
    }

    // Validate observation data
    const observationValidation = validateObservationData({
      comment,
      latitude,
      longitude,
    })

    if (!observationValidation.isValid) {
      return NextResponse.json(
        {
          error: "Observation data validation failed",
          details: observationValidation.errors,
          code: "INVALID_DATA",
        },
        { status: 400 },
      )
    }

    // Parse device info safely
    let deviceInfo
    try {
      deviceInfo = JSON.parse(deviceInfoStr)
    } catch (error) {
      console.warn("Invalid device info JSON, using default")
      deviceInfo = { userAgent: "unknown", platform: "unknown", language: "unknown" }
    }

    // Sanitize comment
    const sanitizedComment = comment ? sanitizeInput(comment) : ""

    console.log("Validation passed. File:", imageFile.name, "Size:", imageFile.size, "Type:", imageFile.type)

    // Generate unique filename with proper extension
    const fileExtension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `public/${fileName}`

    console.log("Uploading to path:", filePath)

    // Convert file to array buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Ensure bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError)
        return NextResponse.json(
          {
            error: "Storage service unavailable",
            code: "STORAGE_UNAVAILABLE",
          },
          { status: 503 },
        )
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
          return NextResponse.json(
            {
              error: "Failed to initialize storage",
              code: "BUCKET_CREATION_FAILED",
            },
            { status: 500 },
          )
        }
        console.log("Bucket created successfully")
      }
    } catch (bucketError) {
      console.error("Bucket operation error:", bucketError)
      return NextResponse.json(
        {
          error: "Storage initialization failed",
          code: "STORAGE_INIT_FAILED",
        },
        { status: 500 },
      )
    }

    // Upload file
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("observations")
      .upload(filePath, uint8Array, {
        contentType: imageFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        {
          error: `File upload failed: ${uploadError.message}`,
          code: "UPLOAD_FAILED",
        },
        { status: 500 },
      )
    }

    console.log(`Upload successful: ${uploadData.path}`)

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage.from("observations").getPublicUrl(filePath)
    const imageUrl = urlData.publicUrl

    // Insert observation record
    const { data: observation, error: dbError } = await supabaseAdmin
      .from("observations")
      .insert({
        image_url: imageUrl,
        comment: sanitizedComment,
        created_at: timestamp || new Date().toISOString(),
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        device_info: deviceInfo,
        status: "Pending",
        user_id: null, // Anonymous submission
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)

      // Try to clean up uploaded file if database insert fails
      try {
        await supabaseAdmin.storage.from("observations").remove([filePath])
        console.log("Cleaned up uploaded file after database error")
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError)
      }

      return NextResponse.json(
        {
          error: `Failed to save observation: ${dbError.message}`,
          code: "DATABASE_ERROR",
        },
        { status: 500 },
      )
    }

    console.log("Observation saved successfully:", observation.id)

    return NextResponse.json({
      success: true,
      id: observation.id,
      imageUrl: imageUrl,
      message: "Observation uploaded successfully",
    })
  } catch (error) {
    console.error("Unexpected server error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
