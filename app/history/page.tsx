"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/components/ui/use-toast"
import { fetchObservations } from "@/lib/api"
import { getLocalObservations, type LocalObservation } from "@/lib/local-storage"
import { MapPin, Calendar, Clock, WifiOff, ImageOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useNetworkStatus } from "@/hooks/use-network-status"

interface Observation extends LocalObservation {
  source: "local" | "remote"
}

export default function HistoryPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadObservations = async () => {
      try {
        setIsLoading(true)

        // Get local observations
        const localObs = await getLocalObservations()
        const localObservations = localObs.map((obs) => ({
          ...obs,
          source: "local" as const,
        }))

        // Get remote observations if online
        let remoteObservations: Observation[] = []
        if (isOnline) {
          try {
            const remoteObs = await fetchObservations()
            remoteObservations = remoteObs.map((obs) => ({
              ...obs,
              source: "remote" as const,
            }))
          } catch (error) {
            console.error("Error fetching remote observations:", error)
            // Continue with local observations only
          }
        }

        // Combine and sort observations
        const allObservations = [...localObservations, ...remoteObservations].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )

        // Remove duplicates (prefer remote)
        const uniqueObservations = allObservations.reduce((acc, current) => {
          const x = acc.find((item) => item.id === current.id)
          if (!x) {
            return acc.concat([current])
          } else if (current.source === "remote" && x.source === "local") {
            // Replace local with remote
            return acc.map((item) => (item.id === current.id ? current : item))
          } else {
            return acc
          }
        }, [] as Observation[])

        setObservations(uniqueObservations)
      } catch (error) {
        console.error("Error loading observations:", error)
        toast({
          title: "Error",
          description: "Failed to load your observation history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadObservations()
  }, [toast, isOnline])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString()
  }

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">{t("history")}</h1>

      {!isOnline && (
        <div className="w-full max-w-md mb-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center">
              <WifiOff className="h-5 w-5 mr-2 text-amber-500" />
              <p className="text-amber-700">{t("offlineMode")}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="w-full max-w-md space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-4">
                <Skeleton className="h-[200px] w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : observations.length === 0 ? (
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>{t("noObservationsYet")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-md space-y-4">
          {observations.map((observation) => (
            <Card key={observation.id} className="w-full">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span className="truncate">{observation.comment}</span>
                  {observation.source === "local" && !isOnline && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                      <WifiOff className="h-3 w-3 mr-1" />
                      {t("localOnly")}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative aspect-video w-full mb-4 bg-muted rounded-md overflow-hidden">
                  {imageErrors[observation.id] ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageOff className="h-12 w-12 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={observation.imageUrl || "/placeholder.svg"}
                      alt={observation.comment}
                      className="object-cover w-full h-full"
                      onError={() => handleImageError(observation.id)}
                    />
                  )}
                  <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 rounded-md text-xs">
                    {observation.status}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    {formatDate(observation.timestamp)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {formatTime(observation.timestamp)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {observation.geolocation.latitude.toFixed(4)}, {observation.geolocation.longitude.toFixed(4)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
