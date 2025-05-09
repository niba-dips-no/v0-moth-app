"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function EnvCheck() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Add a small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      console.log("Checking environment variables...")
      console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL)
      console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

      const vars = [
        { name: "NEXT_PUBLIC_SUPABASE_URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL },
        { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        { name: "NEXT_PUBLIC_SITE_URL", value: process.env.NEXT_PUBLIC_SITE_URL },
      ]

      const missing = vars.filter((v) => !v.value).map((v) => v.name)
      console.log("Missing variables:", missing)

      setMissingVars(missing)
      setChecked(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (!checked) return null
  if (missingVars.length === 0) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Environment Variables</AlertTitle>
      <AlertDescription>
        This app may have limited functionality without the following environment variables:
        <ul className="mt-2 list-disc pl-5">
          {missingVars.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
