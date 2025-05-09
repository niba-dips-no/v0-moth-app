import { getSupabase } from "./supabase/client"

/**
 * Simple update function that directly updates the observation status
 * This avoids complex policy checks that might cause infinite recursion
 */
export async function simpleUpdateObservationStatus(id: string, status: string) {
  try {
    console.log(`[Simple Update] Updating observation ${id} status to ${status}...`)

    // Use a simple update query with minimal fields
    const { data, error } = await getSupabase()
      .from("observations")
      .update({
        status: status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status")

    if (error) {
      console.error("[Simple Update] Error:", error)
      throw error
    }

    console.log("[Simple Update] Success:", data)
    return data[0]
  } catch (error) {
    console.error("[Simple Update] Failed:", error)
    throw error
  }
}
