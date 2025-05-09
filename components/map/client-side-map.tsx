"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
import "leaflet-defaulticon-compatibility"

interface ClientSideMapProps {
  latitude: number
  longitude: number
  accuracy?: number
  zoom?: number
}

export function ClientSideMap({ latitude, longitude, accuracy, zoom = 13 }: ClientSideMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="w-full h-full bg-muted animate-pulse rounded-md"></div>
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[latitude, longitude]} />
      {accuracy && accuracy > 0 && (
        <Circle
          center={[latitude, longitude]}
          radius={accuracy}
          pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
        />
      )}
    </MapContainer>
  )
}
