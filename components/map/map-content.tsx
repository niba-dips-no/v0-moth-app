"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Camera, ArrowLeft } from "lucide-react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import the ObservationMap component with SSR disabled
const ObservationMap = dynamic(() => import("@/components/map/observation-map").then((mod) => mod.ObservationMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
})

export function MapContent() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t("viewMap")}</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("observationMap")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="map" className="flex-1">
                {t("map")}
              </TabsTrigger>
              <TabsTrigger value="satellite" className="flex-1">
                {t("satellite")}
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="flex-1">
                {t("heatmap")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="map" className="m-0">
              <ObservationMap height="500px" />
            </TabsContent>
            <TabsContent value="satellite" className="m-0">
              <div className="h-[500px] bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">{t("satelliteViewComingSoon")}</p>
              </div>
            </TabsContent>
            <TabsContent value="heatmap" className="m-0">
              <div className="h-[500px] bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">{t("heatmapComingSoon")}</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-center">
        <Button onClick={() => router.push("/camera")} className="gap-2">
          <Camera className="h-4 w-4" />
          {t("addObservation")}
        </Button>
      </div>
    </div>
  )
}
