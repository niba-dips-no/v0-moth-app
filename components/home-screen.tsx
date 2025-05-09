"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { Camera, ImageIcon, Info, Map, History } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useStorage } from "@/hooks/use-storage"
import { useAppVersion } from "@/hooks/use-app-version"
import { AppNotifications } from "@/components/app-notifications"

export function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isOnline } = useNetworkStatus()
  const { hasGeolocation } = useGeolocation()
  const { hasStorage } = useStorage()
  const { hasUpdate } = useAppVersion()

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <AppNotifications
        isOnline={isOnline}
        hasGeolocation={hasGeolocation}
        hasStorage={hasStorage}
        hasUpdate={hasUpdate}
      />

      <div className="w-full max-w-md flex flex-col items-center gap-6 mt-8">
        <div className="relative w-full aspect-square max-w-xs">
          <Image src="/logo.svg" alt="Målerjakt Logo" fill className="object-contain" priority />
        </div>

        <h1 className="text-3xl font-bold text-center">{t("appName")}</h1>

        <Card className="w-full">
          <CardContent className="grid grid-cols-2 gap-4 p-4">
            <Button variant="outline" className="flex flex-col gap-2 h-24" onClick={() => router.push("/camera")}>
              <Camera className="h-6 w-6" />
              <span>{t("takePhoto")}</span>
            </Button>

            <Button variant="outline" className="flex flex-col gap-2 h-24" onClick={() => router.push("/gallery")}>
              <ImageIcon className="h-6 w-6" />
              <span>{t("selectPhoto")}</span>
            </Button>

            <Button variant="outline" className="flex flex-col gap-2 h-24" onClick={() => router.push("/info")}>
              <Info className="h-6 w-6" />
              <span>{t("readMore")}</span>
            </Button>

            <Button variant="outline" className="flex flex-col gap-2 h-24" onClick={() => router.push("/history")}>
              <History className="h-6 w-6" />
              <span>{t("history")}</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-2 h-24 col-span-2"
              onClick={() => router.push("/map")}
            >
              <Map className="h-6 w-6" />
              <span>{t("viewMap")}</span>
            </Button>
          </CardContent>
        </Card>

        <Button variant="link" onClick={() => router.push("/subscribe")}>
          {t("subscribeToNewsletter")}
        </Button>
      </div>
    </main>
  )
}
