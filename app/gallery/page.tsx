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
import { Upload, X, Check, MapPin, Loader2 } from "lucide-react"
import { submitObservation } from "@/lib/api"
import { extractExifData } from "@/lib/exif"
import { saveLocalObservation } from "@/lib/local-storage"

export default function GalleryPage() {
  const { t } = useTranslation()
  const { position } = useGeolocation()
  const { toast } = useToast()
  const router = useRouter()

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasGeoLocation, setHasGeoLocation] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Read the file as data URL
    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string
      setSelectedImage(imageDataUrl)

      // Check if image has geolocation data
      try {
        const exifData = await extractExifData(file)
        setHasGeoLocation(!!exifData.latitude && !!exifData.longitude)
      } catch (error) {
        console.error("Error extracting EXIF data:", error)
        setHasGeoLocation(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSelectImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleSubmit = async () => {
    if (!selectedImage) {
      toast({
        title: "Missing Image",
        description: "Please select an image first",
        variant: "destructive",
      })
      return
    }

    if (!position) {
      toast({
        title: "Missing Location",
        description: "Location data is required. Please enable location services.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const timestamp = new Date().toISOString()
      const geolocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }

      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      }

      // Create observation object
      const observation = {
        image: selectedImage,
        comment,
        timestamp,
        geolocation,
        deviceInfo,
      }

      // Submit to Supabase
      const { id, imageUrl } = await submitObservation(observation)

      // Save to local storage for history
      await saveLocalObservation({
        id,
        imageUrl: imageUrl || selectedImage,
        comment,
        timestamp,
        geolocation,
        status: "Pending",
      })

      toast({
        title: t("submissionSuccess"),
        description: new Date().toLocaleString(),
      })

      // Reset form and navigate back
      setSelectedImage(null)
      setComment("")
      router.push("/")
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: t("submissionError"),
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />

          {selectedImage ? (
            <div className="relative">
              <img src={selectedImage || "/placeholder.svg"} alt="Selected" className="w-full rounded-md" />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-white/80"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {!hasGeoLocation && (
                <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 rounded-md flex items-center text-xs text-amber-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  {t("imageMissingGeolocationTitle")}
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-64 bg-muted rounded-md cursor-pointer"
              onClick={handleSelectImage}
            >
              <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("selectPhoto")}</p>
            </div>
          )}

          {selectedImage && (
            <Textarea
              className="mt-4"
              placeholder={t("comment")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            {t("cancel")}
          </Button>

          {selectedImage && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  {t("submit")}
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
