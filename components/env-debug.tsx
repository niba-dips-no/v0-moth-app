"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function EnvDebug() {
  const [show, setShow] = useState(false)
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({})
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    if (show) {
      // Collect environment variables
      const vars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + "...",
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
        NODE_ENV: process.env.NODE_ENV,
      }

      setEnvVars(vars)

      // Check for missing critical variables
      const missing = []
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL")
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

      setMissingVars(missing)
    }
  }, [show])

  if (!show) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShow(true)} className="mb-4">
        Debug Environment
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between">
          Environment Variables
          <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
            Hide
          </Button>
        </CardTitle>
        <CardDescription>Current environment variable values (public only)</CardDescription>
      </CardHeader>
      <CardContent>
        {missingVars.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Missing Critical Environment Variables</AlertTitle>
            <AlertDescription>
              The following environment variables are required but missing:
              <ul className="mt-2 list-disc pl-5">
                {missingVars.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <div className="mt-2">
                <strong>How to fix:</strong>
                <ol className="list-decimal pl-5 mt-1">
                  <li>
                    Add these variables to your <code>.env.local</code> file for local development
                  </li>
                  <li>Add them to your Vercel project settings for production</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">{JSON.stringify(envVars, null, 2)}</pre>

        <div className="mt-4 text-sm">
          <p>
            <strong>Note:</strong> Environment variables with the <code>NEXT_PUBLIC_</code> prefix are exposed to the
            browser.
          </p>
          <p className="mt-2">
            <strong>Supabase URL format:</strong> <code>https://your-project-id.supabase.co</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
