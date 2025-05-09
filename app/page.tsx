import { HomeScreen } from "@/components/home-screen"
import { NetworkStatusProvider } from "@/components/network-status-provider"
import { GeolocationProvider } from "@/components/geolocation-provider"
import { StorageProvider } from "@/components/storage-provider"
import { AppVersionProvider } from "@/components/app-version-provider"

export default function Home() {
  return (
    <NetworkStatusProvider>
      <GeolocationProvider>
        <StorageProvider>
          <AppVersionProvider>
            <HomeScreen />
          </AppVersionProvider>
        </StorageProvider>
      </GeolocationProvider>
    </NetworkStatusProvider>
  )
}
