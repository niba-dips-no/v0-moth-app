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
import { submitObservation } from "@/lib/api"
import { saveLocalObservation } from "@/lib/local-storage"

export default function CameraPage() {
  const { t } = useTranslation()
  const { position, hasGeolocation } = useGeolocation()
  const { toast } = useToast()
  const router = useRouter()

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
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

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL (JPEG format, 0.8 quality)
        try {
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)
          console.log("Image captured, size:", Math.round(imageDataUrl.length / 1024), "KB")
          setCapturedImage(imageDataUrl)
          setIsCameraOpen(false)

          // Set debug info
          setDebugInfo(
            `Image captured: ${Math.round(imageDataUrl.length / 1024)} KB, format: ${imageDataUrl.substring(0, 30)}...`,
          )
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
    if (!capturedImage) {
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
      setDebugInfo("Preparing observation data...")

      // Create observation object
      const observation = {
        image: capturedImage,
        comment,
        timestamp,
        geolocation,
        deviceInfo,
      }

      console.log("Submitting observation...")
      setDebugInfo("Uploading to Supabase...")

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = Math.min(prev + 5, 90)
          return newProgress
        })
      }, 300)

      // Submit to Supabase
      const { id, imageUrl } = await submitObservation(observation)

      clearInterval(progressInterval)
      setUploadProgress(95)
      setDebugInfo(`Observation submitted, ID: ${id}, saving locally...`)

      console.log("Observation submitted successfully, ID:", id)
      console.log("Image URL:", imageUrl)

      // Save to local storage for history
      await saveLocalObservation({
        id,
        imageUrl: imageUrl || capturedImage, // Use the returned URL or fallback to the data URL
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
                onClick={() => setCapturedImage(null)}
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
