import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/database.types"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the user is not signed in and the route is protected, redirect to login
  if (!session && req.nextUrl.pathname.startsWith("/admin")) {
    // Exclude the login page from the redirect
    if (req.nextUrl.pathname !== "/admin/login") {
      const redirectUrl = new URL("/admin/login", req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ["/admin/:path*"],
}
