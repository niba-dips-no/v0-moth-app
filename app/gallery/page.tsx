"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useRouter } from "next/navigation"
import { Upload, X, Check, Loader2, MapPin } from "lucide-react"
import { saveLocalObservation } from "@/lib/local-storage"
import { validateImageFile, validateObservationData, sanitizeInput } from "@/lib/validation"
import { ErrorDisplay } from "@/components/error-display"
import { extractExifData } from "@/lib/exif"

export default function GalleryPage() {
  const { t } = useTranslation()
  const { position } = useGeolocation()
  const { toast } = useToast()
  const router = useRouter()

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [imageLocation, setImageLocation] = useState<{
    latitude: number
    longitude: number
    accuracy?: number
    source: "exif" | "gps" | "none"
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationErrors([])

    // Validate the selected file
    const validation = await validateImageFile(file)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setSelectedFile(file)

    // Extract EXIF data first
    console.log("Extracting EXIF data from image...")
    const exifData = await extractExifData(file)

    let locationData = null

    if (exifData.latitude && exifData.longitude) {
      // Use EXIF location data
      locationData = {
        latitude: exifData.latitude,
        longitude: exifData.longitude,
        accuracy: 10, // EXIF data is usually quite accurate
        source: "exif" as const,
      }
      console.log("Using EXIF location:", locationData)
      toast({
        title: "Location found in image",
        description: `Using GPS coordinates from image: ${exifData.latitude.toFixed(4)}, ${exifData.longitude.toFixed(4)}`,
      })
    } else if (position) {
      // Fall back to current GPS location
      locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: "gps" as const,
      }
      console.log("Using current GPS location:", locationData)
      toast({
        title: "Using current location",
        description: "No GPS data found in image, using your current location",
        variant: "destructive",
      })
    } else {
      // No location available
      locationData = {
        latitude: 0,
        longitude: 0,
        source: "none" as const,
      }
      console.log("No location data available")
    }

    setImageLocation(locationData)

    // Read the file as data URL for preview
    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string
      setSelectedImage(imageDataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleSelectImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!selectedImage || !selectedFile) {
      errors.push("Please select an image")
    }

    if (!imageLocation || imageLocation.source === "none") {
      errors.push("Location data is required. Please select an image with GPS data or enable location services.")
    }

    // Validate observation data
    const observationValidation = validateObservationData({
      comment,
      latitude: imageLocation?.latitude,
      longitude: imageLocation?.longitude,
    })

    if (!observationValidation.isValid) {
      errors.push(...observationValidation.errors)
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !imageLocation) {
      return
    }

    setIsSubmitting(true)
    setValidationErrors([])

    try {
      const timestamp = new Date().toISOString()
      const geolocation = {
        latitude: imageLocation.latitude,
        longitude: imageLocation.longitude,
        accuracy: imageLocation.accuracy || 0,
      }

      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        locationSource: imageLocation.source,
      }

      // Sanitize comment
      const sanitizedComment = sanitizeInput(comment)

      // Create FormData for server-side upload
      const formData = new FormData()
      formData.append("image", selectedFile!)
      formData.append("comment", sanitizedComment)
      formData.append("timestamp", timestamp)
      formData.append("latitude", geolocation.latitude.toString())
      formData.append("longitude", geolocation.longitude.toString())
      formData.append("accuracy", geolocation.accuracy.toString())
      formData.append("deviceInfo", JSON.stringify(deviceInfo))

      // Use our server-side API route
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle different error types
        if (result.code === "INVALID_IMAGE" || result.code === "INVALID_DATA") {
          setValidationErrors(result.details || [result.error])
          return
        }
        throw new Error(result.error || "Upload failed")
      }

      // Save to local storage for history
      await saveLocalObservation({
        id: result.id,
        imageUrl: result.imageUrl || selectedImage,
        comment: sanitizedComment,
        timestamp,
        geolocation,
        status: "Pending",
      })

      toast({
        title: "Success!",
        description: result.message || "Your moth observation has been submitted successfully.",
      })

      // Reset form and navigate back
      setSelectedImage(null)
      setSelectedFile(null)
      setComment("")
      setValidationErrors([])
      setImageLocation(null)
      router.push("/")
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= 1000) {
      setComment(value)
    }
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <ErrorDisplay
            errors={validationErrors}
            onDismiss={() => setValidationErrors([])}
            title="Please fix the following issues:"
          />

          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {selectedImage ? (
            <div className="relative">
              <img src={selectedImage || "/placeholder.svg"} alt="Selected" className="w-full rounded-md" />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-white/80"
                onClick={() => {
                  setSelectedImage(null)
                  setSelectedFile(null)
                  setValidationErrors([])
                  setImageLocation(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>

              {imageLocation && (
                <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded-md flex items-center text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className={imageLocation.source === "exif" ? "text-green-700" : "text-amber-700"}>
                    {imageLocation.source === "exif"
                      ? "Image GPS"
                      : imageLocation.source === "gps"
                        ? "Current GPS"
                        : "No GPS"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-64 bg-muted rounded-md cursor-pointer border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
              onClick={handleSelectImage}
            >
              <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Select an image
                <br />
                <span className="text-xs">Max 10MB • JPEG, PNG, WebP</span>
              </p>
            </div>
          )}

          {selectedImage && imageLocation && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Location:</span>
                <span className={imageLocation.source === "exif" ? "text-green-700" : "text-amber-700"}>
                  {imageLocation.source === "exif"
                    ? "📍 From image GPS"
                    : imageLocation.source === "gps"
                      ? "📱 Current location"
                      : "❌ No location"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCoordinates(imageLocation.latitude, imageLocation.longitude)}
                {imageLocation.accuracy && ` (±${imageLocation.accuracy.toFixed(0)}m)`}
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="mt-4">
              <Textarea
                placeholder="Add a comment about your moth observation (optional)"
                value={comment}
                onChange={handleCommentChange}
                className="resize-none"
                rows={3}
              />
              <div className="text-xs text-muted-foreground mt-1 text-right">{comment.length}/1000 characters</div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>

          {selectedImage && (
            <Button onClick={handleSubmit} disabled={isSubmitting || validationErrors.length > 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Submit
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
