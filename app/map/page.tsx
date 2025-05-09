"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/components/ui/use-toast"
import { fetchObservations } from "@/lib/api"

export default function MapPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [observations, setObservations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadObservations = async () => {
      try {
        const data = await fetchObservations()
        setObservations(data)
      } catch (error) {
        console.error("Error fetching observations:", error)
        toast({
          title: "Error",
          description: "Failed to load map data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadObservations()
  }, [toast])

  useEffect(() => {
    // This would initialize a map library like Leaflet or Mapbox
    // For now, we'll just show a placeholder
    const initMap = () => {
      console.log("Map would be initialized here with", observations.length, "points")
    }

    if (!isLoading && observations.length > 0) {
      initMap()
    }
  }, [isLoading, observations])

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">{t("viewMap")}</h1>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>{t("observationMap")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <p>Loading map data...</p>
            </div>
          ) : (
            <div className="h-[400px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">
                Map placeholder - would show {observations.length} observation points
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
