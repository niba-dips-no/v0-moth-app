"use client"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

interface MiniMapProps {
  latitude: number
  longitude: number
  accuracy?: number
  height?: string
  width?: string
  zoom?: number
  className?: string
}

// Create a client-side only version of the map
const ClientSideMap = dynamic(() => import("./client-side-map").then((mod) => mod.ClientSideMap), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-md" />,
})

export function MiniMap({
  latitude,
  longitude,
  accuracy,
  height = "200px",
  width = "100%",
  zoom = 13,
  className = "",
}: MiniMapProps) {
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
      <ClientSideMap latitude={latitude} longitude={longitude} accuracy={accuracy} zoom={zoom} />
    </div>
  )
}

// Default export for dynamic import
export default { MiniMap }
