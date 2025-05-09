"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { fetchObservations } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

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

// Create a client-side only version of the map
const ClientSideObservationMap = dynamic(
  () => import("./client-side-observation-map").then((mod) => mod.ClientSideObservationMap),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full rounded-md" />,
  },
)

export function ObservationMap({ height = "500px" }: { height?: string }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
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

  if (isLoading) {
    return <Skeleton className="w-full rounded-md" style={{ height }} />
  }

  if (!isClient) {
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
        <ClientSideObservationMap observations={observations} formatDate={formatDate} router={router} />
      )}
    </div>
  )
}

// Default export for dynamic import
export default { ObservationMap }
