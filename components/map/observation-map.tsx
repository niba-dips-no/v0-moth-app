"use client"

import { useEffect, useState } from "react"
import { fetchObservations } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MapPin, Calendar, ExternalLink } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { StaticMap } from "./static-map"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Types
interface Observation {
  id: string
  imageUrl: string
  comment: string
  timestamp: string
  geolocation: {
    latitude: number
    longitude: number
    accuracy: number
  }
  status: string
}

export function ObservationMap({ height = "500px" }: { height?: string }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 59.9139, lng: 10.7522 }) // Oslo, Norway

  useEffect(() => {
    loadObservations()
  }, [toast])

  const loadObservations = async () => {
    try {
      setIsLoading(true)
      const data = await fetchObservations()

      // Filter out observations without valid coordinates
      const validObservations = data.filter(
        (obs) =>
          obs.geolocation &&
          obs.geolocation.latitude &&
          obs.geolocation.longitude &&
          !isNaN(obs.geolocation.latitude) &&
          !isNaN(obs.geolocation.longitude),
      )

      setObservations(validObservations)

      // Calculate center of all observations
      if (validObservations.length > 0) {
        const sumLat = validObservations.reduce((sum, obs) => sum + obs.geolocation.latitude, 0)
        const sumLng = validObservations.reduce((sum, obs) => sum + obs.geolocation.longitude, 0)
        setMapCenter({
          lat: sumLat / validObservations.length,
          lng: sumLng / validObservations.length,
        })
      }
    } catch (error) {
      console.error("Error fetching observations for map:", error)
      toast({
        title: "Error",
        description: "Failed to load map data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const handleMarkerClick = (id: string) => {
    const observation = observations.find((obs) => obs.id === id)
    if (observation) {
      setSelectedObservation(observation)
    }
  }

  if (isLoading) {
    return <Skeleton className="w-full rounded-md" style={{ height }} />
  }

  return (
    <div className="w-full rounded-md overflow-hidden" style={{ height }}>
      {observations.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">{t("noObservationsYet")}</p>
          </div>
        </div>
      ) : (
        <>
          <StaticMap
            latitude={mapCenter.lat}
            longitude={mapCenter.lng}
            height={height}
            width="100%"
            markers={observations.map((obs) => ({
              id: obs.id,
              latitude: obs.geolocation.latitude,
              longitude: obs.geolocation.longitude,
            }))}
            onMarkerClick={handleMarkerClick}
          />

          <Dialog open={!!selectedObservation} onOpenChange={(open) => !open && setSelectedObservation(null)}>
            <DialogContent className="sm:max-w-md">
              {selectedObservation && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedObservation.comment}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden">
                      <img
                        src={selectedObservation.imageUrl || "/placeholder.svg"}
                        alt={selectedObservation.comment}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(selectedObservation.timestamp)}
                      </div>
                      <Badge
                        variant={
                          selectedObservation.status === "Approved"
                            ? "default"
                            : selectedObservation.status === "Rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {selectedObservation.status}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedObservation.geolocation.latitude.toFixed(4)},{" "}
                      {selectedObservation.geolocation.longitude.toFixed(4)}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/observation/${selectedObservation.id}`)}
                    >
                      View Details
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

// Default export for dynamic import
export default { ObservationMap }
