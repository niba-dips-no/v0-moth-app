"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
import "leaflet-defaulticon-compatibility"
import { fetchObservations } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, ExternalLink } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import L from "leaflet"

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

// Recenter map component
function RecenterAutomatically({ observations }: { observations: Observation[] }) {
  const map = useMap()

  useEffect(() => {
    if (observations.length > 0) {
      // Create bounds from all observation points
      const latLngs = observations.map((obs) => [obs.geolocation.latitude, obs.geolocation.longitude])
      const bounds = L.latLngBounds(latLngs.map((coords) => L.latLng(coords[0], coords[1])))

      // Add some padding
      map.fitBounds(bounds.pad(0.1))
    }
  }, [observations, map])

  return null
}

export function ObservationMap({ height = "500px" }: { height?: string }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  // Default center (Oslo, Norway)
  const defaultCenter = [59.9139, 10.7522]

  useEffect(() => {
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

    loadObservations()
  }, [toast])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Handle when map is ready
  const handleMapReady = () => {
    setMapReady(true)
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
        <MapContainer
          center={defaultCenter as [number, number]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          whenReady={handleMapReady}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapReady &&
            observations.map((observation) => (
              <Marker
                key={observation.id}
                position={[observation.geolocation.latitude, observation.geolocation.longitude]}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="relative aspect-video w-full mb-2 bg-muted rounded-sm overflow-hidden">
                      <img
                        src={observation.imageUrl || "/placeholder.svg"}
                        alt={observation.comment}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                      />
                    </div>

                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{observation.comment}</h3>

                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(observation.timestamp)}
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {observation.geolocation.latitude.toFixed(4)}, {observation.geolocation.longitude.toFixed(4)}
                    </div>

                    <div className="flex justify-between items-center">
                      <Badge
                        variant={
                          observation.status === "Approved"
                            ? "default"
                            : observation.status === "Rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {observation.status}
                      </Badge>

                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => router.push(`/observation/${observation.id}`)}
                      >
                        View Details
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {mapReady && <RecenterAutomatically observations={observations} />}
        </MapContainer>
      )}
    </div>
  )
}

// Default export for dynamic import
export default { ObservationMap }
