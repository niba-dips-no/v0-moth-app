import { supabase } from "./supabase/client"
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
    // First, upload the image to Supabase Storage
    const base64Data = data.image.split(",")[1]
    const fileName = `${uuidv4()}.jpg`

    // Make sure the observations bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const observationsBucketExists = buckets?.some((bucket) => bucket.name === "observations")

    if (!observationsBucketExists) {
      console.log("Creating observations bucket...")
      await supabase.storage.createBucket("observations", { public: true })
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("observations")
      .upload(`public/${fileName}`, decode(base64Data), {
        contentType: "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw uploadError
    }

    // Get the public URL for the uploaded image
    const { data: urlData } = supabase.storage.from("observations").getPublicUrl(`public/${fileName}`)

    const imageUrl = urlData.publicUrl

    console.log("Image uploaded successfully:", imageUrl)

    // Get the current user (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Now insert the observation record
    const { data: observation, error } = await supabase
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

    return { id: observation.id, imageUrl }
  } catch (error) {
    console.error("Error submitting observation:", error)
    throw error
  }
}

export async function fetchObservations() {
  try {
    const { data, error } = await supabase.from("observations").select("*").order("created_at", { ascending: false })

    if (error) throw error

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

// Helper function to decode base64
function decode(base64String: string): Uint8Array {
  const binaryString = atob(base64String)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
