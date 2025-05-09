"use client"

import { Suspense } from "react"
import { HistoryContent } from "@/components/history/history-content"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function HistoryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <Suspense
        fallback={
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
        }
      >
        <HistoryContent />
      </Suspense>
    </main>
  )
}
