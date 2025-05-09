"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTranslation } from "@/hooks/use-translation"
import { AlertCircle, Wifi, MapPin, HardDrive, Database, RefreshCw, Clock } from "lucide-react"

interface AppNotificationsProps {
  isOnline: boolean
  hasGeolocation: boolean
  hasStorage: boolean
  hasUpdate: boolean
  isDbReachable?: boolean
  submissionPeriodEnded?: boolean
  imageMissingGeolocation?: boolean
}

export function AppNotifications({
  isOnline,
  hasGeolocation,
  hasStorage,
  hasUpdate,
  isDbReachable = true,
  submissionPeriodEnded = false,
  imageMissingGeolocation = false,
}: AppNotificationsProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full max-w-md space-y-2">
      {!isOnline && (
        <Alert variant="destructive">
          <Wifi className="h-4 w-4" />
          <AlertTitle>{t("noNetworkTitle")}</AlertTitle>
          <AlertDescription>{t("noNetworkDescription")}</AlertDescription>
        </Alert>
      )}

      {!hasGeolocation && (
        <Alert variant="destructive">
          <MapPin className="h-4 w-4" />
          <AlertTitle>{t("noGeolocationTitle")}</AlertTitle>
          <AlertDescription>{t("noGeolocationDescription")}</AlertDescription>
        </Alert>
      )}

      {!hasStorage && (
        <Alert variant="destructive">
          <HardDrive className="h-4 w-4" />
          <AlertTitle>{t("noStorageTitle")}</AlertTitle>
          <AlertDescription>{t("noStorageDescription")}</AlertDescription>
        </Alert>
      )}

      {!isDbReachable && (
        <Alert variant="destructive">
          <Database className="h-4 w-4" />
          <AlertTitle>{t("dbNotReachableTitle")}</AlertTitle>
          <AlertDescription>{t("dbNotReachableDescription")}</AlertDescription>
        </Alert>
      )}

      {hasUpdate && (
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>{t("newVersionTitle")}</AlertTitle>
          <AlertDescription>{t("newVersionDescription")}</AlertDescription>
        </Alert>
      )}

      {submissionPeriodEnded && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("submissionPeriodEndedTitle")}</AlertTitle>
          <AlertDescription>{t("submissionPeriodEndedDescription")}</AlertDescription>
        </Alert>
      )}

      {imageMissingGeolocation && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("imageMissingGeolocationTitle")}</AlertTitle>
          <AlertDescription>{t("imageMissingGeolocationDescription")}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
