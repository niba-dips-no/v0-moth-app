import { getSupabase } from "./supabase/client"
import { v4 as uuidv4 } from "uuid"

interface ObservationData {
  image: string
  comment: string
  timestamp: string
  geolocation: {
    latitude: number
    longitude: number
    accuracy: number
  } | null
  deviceInfo: {
    userAgent: string
    platform: string
    language: string
  }
}

export async function submitObservation(data: ObservationData): Promise<{ id: string; imageUrl: string }> {
  try {
    console.log("Starting observation submission process...")

    // First, check if the image is a data URL
    if (!data.image.startsWith("data:image/")) {
      console.error("Invalid image format:", data.image.substring(0, 30) + "...")
      throw new Error("Invalid image format. Expected a data URL.")
    }

    // Extract the base64 data
    const base64Data = data.image.split(",")[1]
    if (!base64Data) {
      console.error("Could not extract base64 data from image")
      throw new Error("Could not extract base64 data from image")
    }

    console.log("Successfully extracted base64 data, length:", base64Data.length)

    // Generate a unique filename
    const fileName = `${uuidv4()}.jpg`
    console.log(`Generated filename: ${fileName}`)

    // Convert base64 to Uint8Array
    const binaryData = decode(base64Data)
    console.log(`Decoded image data, size: ${binaryData.length} bytes`)

    // Upload the image to Supabase Storage
    console.log("Uploading image to Supabase storage...")

    // First check if the bucket exists
    const { data: buckets, error: bucketsError } = await getSupabase().storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      throw bucketsError
    }

    const observationsBucketExists = buckets?.some((bucket) => bucket.name === "observations")
    console.log("Observations bucket exists:", observationsBucketExists)

    if (!observationsBucketExists) {
      console.log("Creating observations bucket...")
      const { error: createBucketError } = await getSupabase().storage.createBucket("observations", {
        public: true,
      })

      if (createBucketError) {
        console.error("Error creating bucket:", createBucketError)
        throw createBucketError
      }
    }

    // Upload the file
    const { data: uploadData, error: uploadError } = await getSupabase()
      .storage.from("observations")
      .upload(`public/${fileName}`, binaryData, {
        contentType: "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw uploadError
    }

    console.log("Image uploaded successfully:", uploadData?.path)

    // Get the public URL for the uploaded image
    const { data: urlData } = getSupabase().storage.from("observations").getPublicUrl(`public/${fileName}`)
    const imageUrl = urlData.publicUrl
    console.log("Image public URL:", imageUrl)

    // Get the current user (if authenticated)
    const {
      data: { user },
    } = await getSupabase().auth.getUser()
    console.log("Current user:", user?.id || "anonymous")

    // Now insert the observation record
    console.log("Inserting observation record into database...")
    console.log("Observation data:", {
      image_url: imageUrl,
      comment: data.comment,
      latitude: data.geolocation?.latitude,
      longitude: data.geolocation?.longitude,
      accuracy: data.geolocation?.accuracy,
      status: "Pending",
      user_id: user?.id || null,
    })

    const { data: observation, error } = await getSupabase()
      .from("observations")
      .insert({
        image_url: imageUrl,
        comment: data.comment,
        created_at: data.timestamp,
        latitude: data.geolocation?.latitude || 0,
        longitude: data.geolocation?.longitude || 0,
        accuracy: data.geolocation?.accuracy || null,
        device_info: data.deviceInfo,
        status: "Pending",
        user_id: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    console.log("Observation saved successfully:", observation)
    return { id: observation.id, imageUrl }
  } catch (error) {
    console.error("Error submitting observation:", error)
    throw error
  }
}

export async function fetchObservations() {
  try {
    console.log("Fetching observations from database...")
    const { data, error } = await getSupabase()
      .from("observations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching observations:", error)
      throw error
    }

    console.log(`Fetched ${data.length} observations`)

    // Log the first observation to check its structure
    if (data.length > 0) {
      console.log("Sample observation:", {
        id: data[0].id,
        imageUrl: data[0].image_url,
        comment: data[0].comment,
        coordinates: [data[0].latitude, data[0].longitude],
        status: data[0].status,
      })
    }

    return data.map((item) => ({
      id: item.id,
      imageUrl: item.image_url,
      comment: item.comment,
      timestamp: item.created_at,
      geolocation: {
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy || 0,
      },
      deviceInfo: item.device_info,
      status: item.status,
    }))
  } catch (error) {
    console.error("Error fetching observations:", error)
    throw error
  }
}

// Add a new function to update observation status
export async function updateObservationStatus(id: string, status: string) {
  try {
    console.log(`Updating observation ${id} status to ${status}...`)

    // Get the current user (if authenticated)
    const {
      data: { user },
    } = await getSupabase().auth.getUser()

    // Update the observation in the database
    const { data, error } = await getSupabase()
      .from("observations")
      .update({
        status: status,
        reviewer_id: user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating observation status:", error)
      throw error
    }

    console.log("Observation status updated successfully:", data)
    return data
  } catch (error) {
    console.error("Error updating observation status:", error)
    throw error
  }
}

// Helper function to decode base64
function decode(base64String: string): Uint8Array {
  try {
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (error) {
    console.error("Error decoding base64:", error)
    throw new Error("Failed to decode image data")
  }
}

// Add a test function to verify Supabase connection and permissions
export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...")

    // Test authentication
    const { data: authData, error: authError } = await getSupabase().auth.getSession()
    console.log("Auth session:", authData?.session ? "Active" : "None")
    if (authError) console.error("Auth error:", authError)

    // Test storage
    const { data: buckets, error: bucketsError } = await getSupabase().storage.listBuckets()
    console.log(
      "Storage buckets:",
      buckets?.map((b) => b.name),
    )
    if (bucketsError) console.error("Storage error:", bucketsError)

    // Test database
    const { data: obsCount, error: dbError } = await getSupabase().from("observations").select("id", { count: "exact" })

    console.log("Observation count:", obsCount?.length)
    if (dbError) console.error("Database error:", dbError)

    return {
      success: true,
      auth: !authError,
      storage: !bucketsError,
      database: !dbError,
      buckets: buckets?.map((b) => b.name) || [],
      observationCount: obsCount?.length || 0,
    }
  } catch (error) {
    console.error("Connection test error:", error)
    return {
      success: false,
      error: String(error),
    }
  }
}
