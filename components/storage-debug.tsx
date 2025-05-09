"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export function StorageDebug() {
  const [buckets, setBuckets] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const fetchStorageInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get buckets
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        throw bucketsError
      }

      setBuckets(bucketsData || [])

      // Get files from observations bucket if it exists
      if (bucketsData?.some((b) => b.name === "observations")) {
        const { data: filesData, error: filesError } = await supabase.storage.from("observations").list("public", {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        })

        if (filesError) {
          throw filesError
        }

        setFiles(filesData || [])
      }
    } catch (err: any) {
      console.error("Storage debug error:", err)
      setError(err.message || "Failed to fetch storage information")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showDebug) {
      fetchStorageInfo()
    }
  }, [showDebug])

  if (!showDebug) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowDebug(true)} className="mb-4">
        Debug Storage
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Storage Debug</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStorageInfo} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
            Hide
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Storage Buckets</h3>
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : buckets.length === 0 ? (
              <p className="text-muted-foreground">No buckets found</p>
            ) : (
              <ul className="space-y-2">
                {buckets.map((bucket) => (
                  <li key={bucket.id} className="bg-muted p-2 rounded-md">
                    <div className="flex justify-between">
                      <span className="font-medium">{bucket.name}</span>
                      <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                        {bucket.public ? "Public" : "Private"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {bucket.id} • Created: {new Date(bucket.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {buckets.some((b) => b.name === "observations") && (
            <div>
              <h3 className="font-medium mb-2">Files in 'observations/public'</h3>
              {loading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-muted-foreground">No files found</p>
              ) : (
                <ul className="space-y-2">
                  {files.map((file) => (
                    <li key={file.id} className="bg-muted p-2 rounded-md">
                      <div className="flex justify-between">
                        <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                          {Math.round(file.metadata.size / 1024)} KB
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(file.created_at).toLocaleString()}
                      </div>
                      <div className="mt-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/observations/public/${file.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View File
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-medium mb-2">Create Test Image</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
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

                    // Upload to Supabase
                    const base64Data = dataUrl.split(",")[1]
                    const fileName = `test-${Date.now()}.jpg`

                    const { data, error } = await supabase.storage
                      .from("observations")
                      .upload(`public/${fileName}`, decode(base64Data), {
                        contentType: "image/jpeg",
                      })

                    if (error) throw error

                    alert(`Test image uploaded successfully: ${fileName}`)
                    fetchStorageInfo()
                  }
                } catch (err: any) {
                  alert(`Error uploading test image: ${err.message}`)
                  console.error(err)
                }
              }}
            >
              Upload Test Image
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to decode base64
function decode(base64String: string): Uint8Array {
  const binaryString = atob(base64String)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
