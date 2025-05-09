"use client"

import { useState } from "react"
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
import "leaflet-defaulticon-compatibility"

interface MiniMapProps {
  latitude: number
  longitude: number
  accuracy?: number
  height?: string
  width?: string
  zoom?: number
  className?: string
}

export function MiniMap({
  latitude,
  longitude,
  accuracy,
  height = "200px",
  width = "100%",
  zoom = 13,
  className = "",
}: MiniMapProps) {
  const [mapReady, setMapReady] = useState(false)

  // Handle when map is ready
  const handleMapReady = () => {
    setMapReady(true)
  }

  // Validate coordinates
  const validCoordinates = !isNaN(latitude) && !isNaN(longitude)

  if (!validCoordinates) {
    return (
      <div className={`bg-muted flex items-center justify-center rounded-md ${className}`} style={{ height, width }}>
        <p className="text-xs text-muted-foreground">Invalid coordinates</p>
      </div>
    )
  }

  return (
    <div className={`rounded-md overflow-hidden ${className}`} style={{ height, width }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        whenReady={handleMapReady}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {mapReady && (
          <>
            <Marker position={[latitude, longitude]} />

            {accuracy && accuracy > 0 && (
              <Circle
                center={[latitude, longitude]}
                radius={accuracy}
                pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  )
}

// Default export for dynamic import
export default { MiniMap }
