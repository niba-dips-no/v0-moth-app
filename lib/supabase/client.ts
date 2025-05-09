import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// For client-side usage
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // Validate URL format before creating client
  if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
    console.error("Invalid Supabase URL. Please check your NEXT_PUBLIC_SUPABASE_URL environment variable.", {
      providedUrl: supabaseUrl,
    })

    // In development, provide more helpful error message
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "Invalid Supabase URL. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your .env.local file and is a valid URL (e.g., https://your-project.supabase.co)",
      )
    }

    // In production, use a dummy client that logs errors
    // This prevents the app from crashing but won't work for real operations
    return createDummyClient()
  }

  if (!supabaseAnonKey) {
    console.error("Missing Supabase Anon Key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")

    // In development, provide more helpful error message
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "Missing Supabase Anon Key. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your .env.local file.",
      )
    }

    // In production, use a dummy client
    return createDummyClient()
  }

  // Create or return the Supabase client instance
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
      console.log("Supabase client initialized successfully")
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      return createDummyClient()
    }
  }

  return supabaseInstance
}

// Helper function to validate URL format
function isValidUrl(urlString: string): boolean {
  try {
    // Check if it's a valid URL format
    new URL(urlString)
    // Additional check to ensure it's a Supabase URL
    return urlString.includes("supabase.co") || urlString.includes("supabase.in")
  } catch (error) {
    return false
  }
}

// Create a dummy client that logs errors instead of crashing
function createDummyClient() {
  const errorMsg = "Supabase client not properly initialized. Operations will fail."

  // Create a proxy that logs errors for all operations
  return new Proxy({} as ReturnType<typeof createClient>, {
    get: (target, prop) => {
      // For nested properties
      if (typeof prop === "string" && ["storage", "auth", "from"].includes(prop)) {
        return new Proxy(
          {},
          {
            get: () => {
              return (...args: any[]) => {
                console.error(`${errorMsg} Attempted to call Supabase.${String(prop)}...`, { args })
                return { data: null, error: new Error(errorMsg) }
              }
            },
          },
        )
      }

      // For direct methods
      return (...args: any[]) => {
        console.error(`${errorMsg} Attempted to call Supabase.${String(prop)}`, { args })
        return { data: null, error: new Error(errorMsg) }
      }
    },
  })
}

// For backward compatibility
export const supabase = getSupabase()
