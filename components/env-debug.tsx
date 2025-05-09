"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function EnvDebug() {
  const [show, setShow] = useState(false)

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
        <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
          {JSON.stringify(
            {
              NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
              NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + "...",
              NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
              NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
              NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
              NODE_ENV: process.env.NODE_ENV,
            },
            null,
            2,
          )}
        </pre>
      </CardContent>
    </Card>
  )
}
