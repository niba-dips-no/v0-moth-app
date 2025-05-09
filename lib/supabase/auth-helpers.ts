import { supabase } from "./client"
import { getSiteUrl } from "@/lib/env"

// Use this function when inviting users
export async function inviteUser(email: string) {
  const siteUrl = getSiteUrl()
  const redirectTo = `${siteUrl}/auth/callback`

  console.log("Inviting user with redirect to:", redirectTo)

  return supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  })
}

// Use this for login/signup redirects
export function getRedirectUrl(path = "auth/callback") {
  const siteUrl = getSiteUrl()
  const fullPath = path.startsWith("/") ? path.slice(1) : path
  return `${siteUrl}/${fullPath}`
}
