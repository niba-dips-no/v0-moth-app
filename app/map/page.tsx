import { Suspense } from "react"
import { MapContent } from "@/components/map/map-content"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function MapPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-4xl">
            <Card className="w-full">
              <CardContent className="p-4">
                <Skeleton className="h-[500px] w-full" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <MapContent />
      </Suspense>
    </main>
  )
}
