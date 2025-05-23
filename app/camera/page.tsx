"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useRouter } from "next/navigation"
import { Camera, X, Check, Loader2 } from "lucide-react"
import { saveLocalObservation } from "@/lib/local-storage"

export default function CameraPage() {
  const { t } = useTranslation()
  const { position, hasGeolocation } = useGeolocation()
  const { toast } = useToast()
  const router = useRouter()

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isCameraOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isCameraOpen])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)
          setCapturedImage(imageDataUrl)

          // Convert canvas to blob and then to File
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
                setCapturedFile(file)
                console.log("Photo captured as file:", file.name, file.size, "bytes")
              }
            },
            "image/jpeg",
            0.8,
          )

          setIsCameraOpen(false)
          setDebugInfo(`Image captured: ${Math.round(imageDataUrl.length / 1024)} KB`)
        } catch (error) {
          console.error("Error converting canvas to data URL:", error)
          toast({
            title: "Error",
            description: "Failed to process the captured image.",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleSubmit = async () => {
    if (!capturedFile) {
      toast({
        title: "Missing Image",
        description: "Please capture an image first",
        variant: "destructive",
      })
      return
    }

    if (!hasGeolocation || !position) {
      toast({
        title: "Missing Location",
        description: "Location data is required. Please enable location services.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(10)
    setDebugInfo("Starting submission process...")

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

      setUploadProgress(30)
      setDebugInfo("Preparing form data...")

      // Create FormData for the API request
      const formData = new FormData()
      formData.append("image", capturedFile)
      formData.append("comment", comment)
      formData.append("latitude", geolocation.latitude.toString())
      formData.append("longitude", geolocation.longitude.toString())
      formData.append("accuracy", geolocation.accuracy.toString())
      formData.append("deviceInfo", JSON.stringify(deviceInfo))
      formData.append("timestamp", timestamp)

      setUploadProgress(50)
      setDebugInfo("Uploading to server...")

      // Upload via API route
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(80)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const result = await response.json()

      setUploadProgress(95)
      setDebugInfo(`Observation submitted, ID: ${result.id}, saving locally...`)

      console.log("Observation submitted successfully, ID:", result.id)
      console.log("Image URL:", result.imageUrl)

      // Save to local storage for history
      await saveLocalObservation({
        id: result.id,
        imageUrl: result.imageUrl,
        comment,
        timestamp,
        geolocation,
        status: "Pending",
      })

      setUploadProgress(100)
      setDebugInfo("Submission complete!")

      toast({
        title: t("submissionSuccess"),
        description: new Date().toLocaleString(),
      })

      // Reset form and navigate back
      setCapturedImage(null)
      setCapturedFile(null)
      setComment("")
      router.push("/")
    } catch (error) {
      console.error("Submission error:", error)
      setDebugInfo(`Error: ${String(error)}`)
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
          {isCameraOpen ? (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full w-16 h-16"
                onClick={capturePhoto}
              >
                <Camera className="h-8 w-8" />
              </Button>
            </div>
          ) : capturedImage ? (
            <div className="relative">
              <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full rounded-md" />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-white/80"
                onClick={() => {
                  setCapturedImage(null)
                  setCapturedFile(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-64 bg-muted rounded-md cursor-pointer"
              onClick={() => setIsCameraOpen(true)}
            >
              <Camera className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("takePhoto")}</p>
            </div>
          )}

          {capturedImage && (
            <Textarea
              className="mt-4"
              placeholder={t("comment")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center mt-1 text-muted-foreground">
                {uploadProgress}% - {uploadProgress < 50 ? "Uploading image..." : "Processing..."}
              </p>
            </div>
          )}

          {debugInfo && (
            <div className="mt-4 p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground break-words">{debugInfo}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            {t("cancel")}
          </Button>

          {capturedImage && (
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
