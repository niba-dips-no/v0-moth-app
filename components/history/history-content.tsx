"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/components/ui/use-toast"
import { fetchObservations } from "@/lib/api"
import { getLocalObservations, updateLocalObservation, type LocalObservation } from "@/lib/local-storage"
import { MapPin, Calendar, Clock, WifiOff, ImageOff, Map, RefreshCw, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import dynamic from "next/dynamic"

// Dynamically import the MiniMap component with SSR disabled
const MiniMap = dynamic(() => import("@/components/map/mini-map").then((mod) => mod.MiniMap), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[300px] rounded-md" />,
})

interface Observation extends LocalObservation {
  source: "local" | "remote"
}

export function HistoryContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const { isOnline } = useNetworkStatus()
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)

  useEffect(() => {
    loadObservations()
  }, [isOnline]) // Reload when online status changes

  const loadObservations = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

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

          // Update local storage with remote data to keep them in sync
          for (const remoteObs of remoteObs) {
            const localObs = localObservations.find((obs) => obs.id === remoteObs.id)
            if (localObs && localObs.status !== remoteObs.status) {
              // Update local storage with the remote status
              await updateLocalObservation(remoteObs.id, {
                status: remoteObs.status,
              })
            }
          }
        } catch (error) {
          console.error("Error fetching remote observations:", error)
          // Continue with local observations only
          if (forceRefresh) {
            toast({
              title: "Error",
              description: "Failed to refresh remote observations",
              variant: "destructive",
            })
          }
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

      if (forceRefresh) {
        toast({
          title: "Refreshed",
          description: "Observation history has been updated",
        })
      }
    } catch (error) {
      console.error("Error loading observations:", error)
      toast({
        title: "Error",
        description: "Failed to load your observation history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadObservations(true)
  }

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

  // Function to get the appropriate badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t("history")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || !isOnline}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/map")}>
            <Map className="h-4 w-4 mr-2" />
            {t("viewMap")}
          </Button>
        </div>
      </div>

      {!isOnline && (
        <Card className="bg-amber-50 border-amber-200 mb-4">
          <CardContent className="p-4 flex items-center">
            <WifiOff className="h-5 w-5 mr-2 text-amber-500" />
            <p className="text-amber-700">{t("offlineMode")}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="w-full space-y-4">
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
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <p>{t("noObservationsYet")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full space-y-4">
          {observations.map((observation) => (
            <Card key={observation.id} className="w-full">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span className="truncate">{observation.comment}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(observation.status)}>{observation.status}</Badge>
                    {observation.source === "local" && !isOnline && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <WifiOff className="h-3 w-3 mr-1" />
                        {t("localOnly")}
                      </Badge>
                    )}
                  </div>
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

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setSelectedObservation(observation)}
                    >
                      <Map className="h-4 w-4 mr-2" />
                      {t("viewOnMap")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{observation.comment}</DialogTitle>
                    </DialogHeader>
                    <div className="h-[300px]">
                      <MiniMap
                        latitude={observation.geolocation.latitude}
                        longitude={observation.geolocation.longitude}
                        accuracy={observation.geolocation.accuracy}
                        height="100%"
                        zoom={14}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
