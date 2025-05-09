import { getSupabase } from "./client"

export async function verifyDatabaseSetup() {
  const supabase = getSupabase()

  try {
    console.log("Verifying database setup...")

    // Check if observations table exists
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables")

    if (tablesError) {
      console.error("Error checking tables:", tablesError)

      // Try to create the observations table if it doesn't exist
      const { error: createError } = await supabase.rpc("create_observations_table")

      if (createError) {
        console.error("Error creating observations table:", createError)
        return {
          success: false,
          message: "Failed to verify database setup",
          error: createError,
        }
      }
    }

    // Check if RLS policies are set up correctly
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "observations")

    if (policiesError) {
      console.error("Error checking policies:", policiesError)
      return {
        success: false,
        message: "Failed to check RLS policies",
        error: policiesError,
      }
    }

    // If no update policy exists, create one
    const hasUpdatePolicy = policies?.some(
      (p) =>
        p.cmd === "UPDATE" &&
        (p.policyname === "Admins can update observations" || p.policyname === "Anyone can update observations"),
    )

    if (!hasUpdatePolicy) {
      console.log("No update policy found, creating one...")

      // Execute SQL to create the policy
      const { error: policyError } = await supabase.rpc("create_update_policy")

      if (policyError) {
        console.error("Error creating update policy:", policyError)
        return {
          success: false,
          message: "Failed to create update policy",
          error: policyError,
        }
      }
    }

    return {
      success: true,
      message: "Database setup verified successfully",
    }
  } catch (error) {
    console.error("Error verifying database setup:", error)
    return {
      success: false,
      message: "Unexpected error verifying database setup",
      error,
    }
  }
}
