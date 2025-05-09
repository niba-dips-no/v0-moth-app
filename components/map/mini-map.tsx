"use client"

import { StaticMap } from "./static-map"

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
  return (
    <StaticMap
      latitude={latitude}
      longitude={longitude}
      height={height}
      width={width}
      zoom={zoom}
      className={className}
    />
  )
}

// Default export for dynamic import
export default { MiniMap }
