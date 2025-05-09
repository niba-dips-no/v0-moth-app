import { getSupabase } from "./supabase/client"

/**
 * Direct update function that bypasses complex policy checks
 * This is a workaround for the infinite recursion issue in RLS policies
 */
export async function directUpdateObservationStatus(id: string, status: string) {
  try {
    console.log(`[Direct Update] Updating observation ${id} status to ${status}...`)

    // Use a simpler update query without complex policy checks
    const { data, error } = await getSupabase().rpc("update_observation_status", {
      observation_id: id,
      new_status: status,
      reviewed_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[Direct Update] Error:", error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error("[Direct Update] Failed:", error)
    throw error
  }
}
