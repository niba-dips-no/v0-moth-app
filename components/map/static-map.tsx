"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin } from "lucide-react"

interface StaticMapProps {
  latitude: number
  longitude: number
  accuracy?: number
  height?: string
  width?: string
  zoom?: number
  className?: string
  markers?: Array<{
    latitude: number
    longitude: number
    id: string
  }>
  onMarkerClick?: (id: string) => void
}

export function StaticMap({
  latitude,
  longitude,
  height = "200px",
  width = "100%",
  zoom = 13,
  className = "",
  markers = [],
  onMarkerClick,
}: StaticMapProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Validate coordinates
  const validCoordinates = !isNaN(latitude) && !isNaN(longitude)

  if (!validCoordinates) {
    return (
      <div className={`bg-muted flex items-center justify-center rounded-md ${className}`} style={{ height, width }}>
        <p className="text-xs text-muted-foreground">Invalid coordinates</p>
      </div>
    )
  }

  // Generate a static map URL from OpenStreetMap
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${
    longitude + 0.01
  },${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`

  return (
    <div className={`rounded-md overflow-hidden relative ${className}`} style={{ height, width }}>
      {isLoading && <Skeleton className="absolute inset-0" />}
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        allowFullScreen
        aria-hidden="false"
        tabIndex={0}
        onLoad={() => setIsLoading(false)}
        className="rounded-md"
      />

      {/* Add markers if provided */}
      {markers.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{
                // This is a very simplified positioning that won't be accurate
                // but will at least show markers in the general area
                left: `${((marker.longitude - (longitude - 0.01)) / 0.02) * 100}%`,
                top: `${(1 - (marker.latitude - (latitude - 0.01)) / 0.02) * 100}%`,
              }}
              onClick={() => onMarkerClick && onMarkerClick(marker.id)}
            >
              <MapPin className="h-6 w-6 text-primary" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default { StaticMap }
