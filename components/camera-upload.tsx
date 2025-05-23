"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Camera, CameraResultType, CameraSource, CameraDirection } from "@capacitor/camera"
import { Button } from "@/components/ui/button"
import { Loader2, CameraIcon, Upload, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CameraUploadProps {
  onImageCaptured?: (url: string, path: string) => void
}

export function CameraUpload({ onImageCaptured }: CameraUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // Initialize PWA Elements for camera functionality
  useEffect(() => {
    const loadPwaElements = async () => {
      if (typeof window !== "undefined") {
        try {
          await import("@ionic/pwa-elements")
          console.log("PWA Elements loaded")
        } catch (error) {
          console.error("Failed to load PWA Elements:", error)
        }
      }
    }
    loadPwaElements()
  }, [])

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      // Call the callback if provided
      if (onImageCaptured) {
        onImageCaptured(result.url, result.path)
      }

      toast({
        title: "Image uploaded successfully",
        description: "Your moth observation has been uploaded.",
      })

      return result
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was a problem uploading your image.",
        variant: "destructive",
      })
      throw error
    }
  }

  const captureImage = async (source: CameraSource) => {
    try {
      setUploading(true)

      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source,
        quality: 90,
        width: 1080,
        height: 1080,
        correctOrientation: true,
        direction: CameraDirection.Rear,
      })

      if (!photo || !photo.dataUrl) {
        throw new Error("No photo data returned")
      }

      // Convert dataUrl to blob
      const response = await fetch(photo.dataUrl)
      const blob = await response.blob()
      const fileExt = photo.format || "jpeg"
      const file = new File([blob], `moth-${Date.now()}.${fileExt}`, {
        type: `image/${fileExt}`,
      })

      await uploadFile(file)
    } catch (error: any) {
      console.error("Error capturing image:", error)
      toast({
        title: "Capture failed",
        description: error.message || "There was a problem capturing your image.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const file = files[0]
      await uploadFile(file)
    } catch (error) {
      // Error already handled in uploadFile
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => captureImage(CameraSource.Camera)}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CameraIcon className="h-4 w-4" />}
          Take Photo
        </Button>
        <Button
          onClick={() => captureImage(CameraSource.Photos)}
          disabled={uploading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Gallery
        </Button>
      </div>

      {/* File input fallback */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 mb-2">Or upload directly:</p>
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors">
            <ImageIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Select image file</span>
          </div>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  )
}
