"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function EnvCheck() {
  const [showError, setShowError] = useState(false)
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    // Only check for essential Supabase variables
    const timer = setTimeout(() => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const missing = []
      if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
      if (!supabaseKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

      if (missing.length > 0) {
        setMissingVars(missing)
        setShowError(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (!showError) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Supabase Configuration</AlertTitle>
      <AlertDescription>
        Required Supabase variables not found:
        <ul className="mt-2 list-disc pl-5">
          {missingVars.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <div className="mt-2">
          <strong>Add these to your .env.local file:</strong>
          <pre className="mt-1 text-xs bg-muted p-2 rounded">
            NEXT_PUBLIC_SUPABASE_URL=your_supabase_url{"\n"}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
          </pre>
        </div>
      </AlertDescription>
    </Alert>
  )
}
