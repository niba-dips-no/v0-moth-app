"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
import "leaflet-defaulticon-compatibility"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, ExternalLink } from "lucide-react"
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

interface ClientSideObservationMapProps {
  observations: Observation[]
  formatDate: (dateString: string) => string
  router: any
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

export function ClientSideObservationMap({ observations, formatDate, router }: ClientSideObservationMapProps) {
  // Default center (Oslo, Norway)
  const defaultCenter = [59.9139, 10.7522]
  const [mapReady, setMapReady] = useState(false)

  // Handle when map is ready
  const handleMapReady = () => {
    setMapReady(true)
  }

  return (
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
          <Marker key={observation.id} position={[observation.geolocation.latitude, observation.geolocation.longitude]}>
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
  )
}
