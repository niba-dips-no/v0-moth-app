"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface MiniMapProps {
  latitude: number
  longitude: number
  accuracy?: number
  height?: string
  zoom?: number
}

export function MiniMap({ latitude, longitude, accuracy, height = "300px", zoom = 13 }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize the map with the observation's coordinates
    const map = L.map(mapRef.current).setView([latitude, longitude], zoom)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add marker at the observation location
    const marker = L.marker([latitude, longitude]).addTo(map)
    marker.bindPopup(`Photo taken here<br>Lat: ${latitude.toFixed(4)}<br>Lng: ${longitude.toFixed(4)}`)

    // Add accuracy circle if available
    if (accuracy && accuracy > 0) {
      L.circle([latitude, longitude], {
        color: "blue",
        fillColor: "#3388ff",
        fillOpacity: 0.2,
        radius: accuracy,
      }).addTo(map)
    }

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, accuracy, zoom])

  // Update map view when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], zoom)

      // Clear existing markers and add new one
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          mapInstanceRef.current?.removeLayer(layer)
        }
      })

      // Add new marker
      const marker = L.marker([latitude, longitude]).addTo(mapInstanceRef.current)
      marker.bindPopup(`Photo taken here<br>Lat: ${latitude.toFixed(4)}<br>Lng: ${longitude.toFixed(4)}`)

      // Add accuracy circle if available
      if (accuracy && accuracy > 0) {
        L.circle([latitude, longitude], {
          color: "blue",
          fillColor: "#3388ff",
          fillOpacity: 0.2,
          radius: accuracy,
        }).addTo(mapInstanceRef.current)
      }
    }
  }, [latitude, longitude, accuracy, zoom])

  return <div ref={mapRef} style={{ height, width: "100%" }} />
}
