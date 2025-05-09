"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { testSupabaseConnection } from "@/lib/api"
import { Loader2, Check, X, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SupabaseDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testImage, setTestImage] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const runConnectionTest = async () => {
    setLoading(true)
    setConnectionError(null)

    try {
      // Check if environment variables exist
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setConnectionError(
          "Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.",
        )
        setTestResult(null)
        return
      }

      const result = await testSupabaseConnection()
      setTestResult(result)

      if (!result.success) {
        setConnectionError(result.error || "Unknown connection error")
      }
    } catch (error) {
      console.error("Test error:", error)
      setConnectionError(String(error))
      setTestResult(null)
    } finally {
      setLoading(false)
    }
  }

  const createTestImage = () => {
    try {
      // Create a simple canvas with text
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#f0f0f0"
        ctx.fillRect(0, 0, 400, 300)
        ctx.fillStyle = "#333"
        ctx.font = "20px Arial"
        ctx.fillText("Test Image", 150, 150)
        ctx.fillText(new Date().toLocaleString(), 100, 180)

        // Convert to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
        setTestImage(dataUrl)
      }
    } catch (error) {
      console.error("Error creating test image:", error)
    }
  }

  if (!showDebug) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowDebug(true)} className="mb-4">
        Debug Supabase
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Supabase Debug</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runConnectionTest} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Connection"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
            Hide
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {connectionError}

              <div className="mt-2">
                <strong>Troubleshooting:</strong>
                <ol className="list-decimal pl-5 mt-1">
                  <li>Check that your Supabase URL and anon key are correct</li>
                  <li>Verify that your Supabase project is active</li>
                  <li>Check your network connection</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Auth:</span>
                  {testResult.auth ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Storage:</span>
                  {testResult.storage ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Database:</span>
                  {testResult.database ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Observations:</span>
                  <span>{testResult.observationCount}</span>
                </div>
              </div>
            </div>

            {testResult.buckets && (
              <div>
                <h3 className="font-medium mb-2">Storage Buckets:</h3>
                <div className="bg-muted p-3 rounded-md">
                  {testResult.buckets.length === 0 ? (
                    <p className="text-muted-foreground">No buckets found</p>
                  ) : (
                    <ul className="list-disc pl-5">
                      {testResult.buckets.map((bucket: string) => (
                        <li key={bucket}>{bucket}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {testResult.error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{testResult.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-medium mb-2">Environment Variables</h3>
          <div className="bg-muted p-3 rounded-md mb-4">
            <p>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}
            </p>
            <p>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                ? "Set (starts with " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + "...)"
                : "Not set"}
            </p>
          </div>

          <h3 className="font-medium mb-2">Test Image Upload</h3>
          <div className="flex flex-col gap-4">
            <Button variant="outline" size="sm" onClick={createTestImage}>
              Create Test Image
            </Button>

            {testImage && (
              <div className="space-y-2">
                <div className="border rounded-md overflow-hidden">
                  <img src={testImage || "/placeholder.svg"} alt="Test" className="w-full" />
                </div>
                <p className="text-xs text-muted-foreground">Image size: {Math.round(testImage.length / 1024)} KB</p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { submitObservation } = await import("@/lib/api")
                      const result = await submitObservation({
                        image: testImage,
                        comment: "Test image from debug tool",
                        timestamp: new Date().toISOString(),
                        geolocation: {
                          latitude: 59.9139,
                          longitude: 10.7522,
                          accuracy: 10,
                        },
                        deviceInfo: {
                          userAgent: navigator.userAgent,
                          platform: navigator.platform,
                          language: navigator.language,
                        },
                      })
                      alert(`Test image uploaded successfully! ID: ${result.id}`)
                    } catch (error) {
                      console.error("Test upload error:", error)
                      alert(`Error uploading test image: ${error}`)
                    }
                  }}
                >
                  Upload Test Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
