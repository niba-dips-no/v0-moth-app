"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, X, AlertTriangle, Upload, Database, Shield, HardDrive } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SupabaseDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testUploading, setTestUploading] = useState(false)
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

      // Try server-side API first
      try {
        const response = await fetch("/api/debug/supabase")

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`)
        }

        const result = await response.json()
        setTestResult(result)

        if (!result.success) {
          setConnectionError(result.error || "Unknown connection error")
        }
        return
      } catch (apiError) {
        console.warn("Server-side API failed, falling back to client-side:", apiError)

        // Fallback to client-side testing
        const testResult = {
          success: true,
          auth: false,
          storage: false,
          database: false,
          observationCount: 0,
          buckets: [],
          responseTime: 0,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          fallback: true,
        }

        const startTime = Date.now()

        try {
          // Import dynamically to avoid SSR issues
          const { createClient } = await import("@supabase/supabase-js")
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

          // Test auth
          const { data: authData, error: authError } = await supabase.auth.getSession()
          testResult.auth = !authError

          // Test database (limited by RLS)
          const { data: dbData, error: dbError } = await supabase.from("observations").select("id").limit(1)
          testResult.database = !dbError

          // Test storage (limited by RLS)
          const { data: bucketData, error: storageError } = await supabase.storage.listBuckets()
          testResult.storage = !storageError

          if (bucketData) {
            testResult.buckets = bucketData.map((bucket) => ({
              name: bucket.name,
              public: bucket.public || false,
              file_count: "N/A (RLS limited)", // Can't get count with anon key
            }))
          }

          testResult.responseTime = Date.now() - startTime
        } catch (error) {
          console.error("Client-side test error:", error)
          testResult.success = false
          testResult.error = String(error)
        }

        setTestResult(testResult)

        if (!testResult.success) {
          setConnectionError(testResult.error || "Unknown connection error")
        }
      }
    } catch (error) {
      console.error("Test error:", error)
      setConnectionError(String(error))
      setTestResult(null)
    } finally {
      setLoading(false)
    }
  }

  const testUploadViaAPI = async () => {
    setTestUploading(true)
    try {
      // Create a test image
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#e0f2fe"
        ctx.fillRect(0, 0, 400, 300)
        ctx.fillStyle = "#0369a1"
        ctx.font = "20px Arial"
        ctx.fillText("Supabase Connection Test", 60, 140)
        ctx.fillText(new Date().toLocaleString(), 80, 170)
        ctx.font = "14px Arial"
        ctx.fillText("Upload via server-side API", 100, 200)

        // Convert to blob and upload via our API
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const formData = new FormData()
              formData.append("image", blob, "supabase-debug-test.jpg")
              formData.append("comment", "Supabase debug connection test upload")
              formData.append("latitude", "59.9139")
              formData.append("longitude", "10.7522")
              formData.append("accuracy", "10")
              formData.append(
                "deviceInfo",
                JSON.stringify({
                  userAgent: "Supabase Debug Tool",
                  platform: "debug",
                  language: "en",
                }),
              )
              formData.append("timestamp", new Date().toISOString())

              const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              })

              let result
              try {
                result = await response.json()
              } catch (e) {
                const text = await response.text()
                throw new Error(`Invalid response: ${text.substring(0, 200)}`)
              }

              if (response.ok) {
                alert(`✅ Test upload successful!\nID: ${result.id}\nImage URL: ${result.imageUrl}`)
                // Refresh the connection test to show updated counts
                runConnectionTest()
              } else {
                throw new Error(result.error || "Upload failed")
              }
            }
          },
          "image/jpeg",
          0.8,
        )
      }
    } catch (error: any) {
      console.error("Test upload error:", error)
      alert(`❌ Test upload failed: ${error.message}`)
    } finally {
      setTestUploading(false)
    }
  }

  if (!showDebug) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowDebug(true)} className="mb-4">
        🔗 Debug Supabase
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          🔗 Supabase Connection Debug
          {testResult?.success && <Check className="h-4 w-4 text-green-500" />}
          {connectionError && <X className="h-4 w-4 text-red-500" />}
          {testResult?.fallback && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Client-side fallback</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runConnectionTest} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Connection"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={testUploadViaAPI}
            disabled={testUploading || !testResult?.success}
            title={!testResult?.success ? "Run connection test first" : "Upload a test image"}
          >
            {testUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Test Upload
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
                  <li>Ensure SUPABASE_SERVICE_ROLE_KEY is set for full functionality</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {testResult?.fallback && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Limited Functionality</AlertTitle>
            <AlertDescription>
              Using client-side fallback. Some data may be limited due to RLS policies. Add SUPABASE_SERVICE_ROLE_KEY
              environment variable for full debugging capabilities.
            </AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-4">
            {/* Service Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Authentication</span>
                  </div>
                  {testResult.auth ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="font-medium">Storage</span>
                  </div>
                  {testResult.storage ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Database</span>
                  </div>
                  {testResult.database ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Observations</span>
                  <span className="text-lg font-bold text-blue-600">
                    {testResult.observationCount || 0}
                    {testResult.fallback && <span className="text-xs text-muted-foreground ml-1">(limited)</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Storage Buckets */}
            {testResult.buckets && (
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Storage Buckets ({testResult.buckets.length})
                </h3>
                <div className="bg-muted p-3 rounded-md">
                  {testResult.buckets.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No buckets found</p>
                      {testResult.fallback && (
                        <p className="text-xs text-muted-foreground mt-1">
                          This may be due to RLS restrictions. Try adding SUPABASE_SERVICE_ROLE_KEY.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {testResult.buckets.map((bucket: any) => (
                        <div
                          key={bucket.name}
                          className="flex items-center justify-between p-2 bg-background rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${bucket.public ? "bg-green-500" : "bg-yellow-500"}`}
                            ></span>
                            <span className="font-medium">{bucket.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {bucket.public ? "Public" : "Private"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{bucket.file_count} files</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connection Details */}
            <div>
              <h3 className="font-medium mb-2">Connection Details</h3>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <code className="text-sm">Project URL</code>
                  <span className="text-xs text-muted-foreground">
                    {testResult.url ? testResult.url.substring(0, 40) + "..." : "Not available"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <code className="text-sm">Connection Status</code>
                  <span
                    className={`text-xs px-2 py-1 rounded ${testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {testResult.success ? "Connected" : "Failed"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <code className="text-sm">Response Time</code>
                  <span className="text-xs text-muted-foreground">
                    {testResult.responseTime ? `${testResult.responseTime}ms` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <code className="text-sm">Test Method</code>
                  <span className="text-xs text-muted-foreground">
                    {testResult.fallback ? "Client-side (limited)" : "Server-side (full)"}
                  </span>
                </div>
              </div>
            </div>

            {testResult.error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                <p className="font-medium">Error Details:</p>
                <p className="text-sm">{testResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Environment Check */}
        <div className="mt-4">
          <h3 className="font-medium mb-2">Environment Configuration</h3>
          <div className="bg-muted p-3 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <code className="text-sm">NEXT_PUBLIC_SUPABASE_URL</code>
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-500">Not set</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <code className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-500">Not set</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
