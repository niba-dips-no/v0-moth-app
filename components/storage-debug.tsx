"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, ImageIcon, HardDrive } from "lucide-react"

interface StorageDebugData {
  buckets: any[]
  files: any[]
  stats: {
    totalFiles: number
    totalSize: number
    formattedSize: string
  } | null
}

export function StorageDebug() {
  const [data, setData] = useState<StorageDebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchStorageInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/storage")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch storage info")
      }

      setData(result)
    } catch (err: any) {
      console.error("Storage debug error:", err)
      setError(err.message || "Failed to fetch storage information")
    } finally {
      setLoading(false)
    }
  }

  const uploadTestImage = async () => {
    setUploading(true)
    try {
      // Create a simple canvas with text
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Create a colorful test image
        ctx.fillStyle = "#e3f2fd"
        ctx.fillRect(0, 0, 400, 300)

        // Add some visual elements
        ctx.fillStyle = "#1976d2"
        ctx.fillRect(50, 50, 300, 200)

        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "center"
        ctx.fillText("DEBUG TEST IMAGE", 200, 130)

        ctx.font = "16px Arial"
        ctx.fillText(new Date().toLocaleString(), 200, 160)
        ctx.fillText(`Random: ${Math.random().toString(36).substr(2, 9)}`, 200, 180)

        // Convert canvas to blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              throw new Error("Failed to create image blob")
            }

            // Create form data
            const formData = new FormData()
            formData.append("image", blob, "debug-test.jpg")
            formData.append("comment", "Debug test image upload")
            formData.append("latitude", "59.9139") // Oslo coordinates
            formData.append("longitude", "10.7522")
            formData.append("accuracy", "10")
            formData.append(
              "deviceInfo",
              JSON.stringify({
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                source: "debug-test",
              }),
            )
            formData.append("timestamp", new Date().toISOString())

            // Upload using our API route
            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
              throw new Error(result.error || "Upload failed")
            }

            alert(`Test image uploaded successfully!\nID: ${result.id}\nURL: ${result.imageUrl}`)

            // Refresh storage info
            await fetchStorageInfo()
          },
          "image/jpeg",
          0.8,
        )
      }
    } catch (err: any) {
      console.error("Test upload error:", err)
      alert(`Error uploading test image: ${err.message}`)
    } finally {
      setUploading(false)
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
        <Database className="h-4 w-4 mr-2" />
        Debug Storage
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Storage Debug
        </CardTitle>
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
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading storage information...</span>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Storage Stats */}
            {data.stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <HardDrive className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">Storage Used</div>
                  <div className="text-lg font-bold">{data.stats.formattedSize}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <ImageIcon className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <div className="text-sm font-medium">Total Files</div>
                  <div className="text-lg font-bold">{data.stats.totalFiles}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Database className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                  <div className="text-sm font-medium">Buckets</div>
                  <div className="text-lg font-bold">{data.buckets.length}</div>
                </div>
              </div>
            )}

            {/* Storage Buckets */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Storage Buckets ({data.buckets.length})
              </h3>
              {data.buckets.length === 0 ? (
                <p className="text-muted-foreground bg-muted p-3 rounded-md">No buckets found</p>
              ) : (
                <div className="space-y-2">
                  {data.buckets.map((bucket) => (
                    <div key={bucket.id} className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{bucket.name}</span>
                          <div className="text-xs text-muted-foreground mt-1">ID: {bucket.id}</div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(bucket.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={bucket.public ? "default" : "secondary"}>
                          {bucket.public ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files in observations bucket */}
            {data.buckets.some((b) => b.name === "observations") && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Files in 'observations/public' ({data.files.length})
                </h3>
                {data.files.length === 0 ? (
                  <p className="text-muted-foreground bg-muted p-3 rounded-md">No files found</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.files.map((file) => (
                      <div key={file.id || file.name} className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{file.name}</span>
                            <div className="text-xs text-muted-foreground mt-1">
                              Created: {new Date(file.created_at).toLocaleString()}
                            </div>
                            {file.metadata?.size && (
                              <div className="text-xs text-muted-foreground">
                                Size: {Math.round(file.metadata.size / 1024)} KB
                              </div>
                            )}
                          </div>
                          <div className="ml-2">
                            <a
                              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/observations/public/${file.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Test Upload */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Test Upload</h3>
              <Button variant="outline" size="sm" onClick={uploadTestImage} disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading Test Image...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Test Image
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will create and upload a test image using the same API route as the camera/gallery pages.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Click "Refresh" to load storage information</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
