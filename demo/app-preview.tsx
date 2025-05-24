"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, History, Map, Info, Settings, ArrowLeft } from "lucide-react"

type Screen = "home" | "camera" | "gallery" | "history" | "map" | "info" | "admin"

export default function AppPreview() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")

  const screens = {
    home: {
      title: "Målerjakt",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🦋</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Målerjakt</h1>
            <p className="text-muted-foreground">Help us track moth populations in Norway</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setCurrentScreen("camera")} className="h-20 flex-col gap-2">
              <Camera className="h-6 w-6" />
              Take Photo
            </Button>
            <Button onClick={() => setCurrentScreen("gallery")} variant="outline" className="h-20 flex-col gap-2">
              <Upload className="h-6 w-6" />
              Gallery
            </Button>
            <Button onClick={() => setCurrentScreen("history")} variant="outline" className="h-20 flex-col gap-2">
              <History className="h-6 w-6" />
              History
            </Button>
            <Button onClick={() => setCurrentScreen("map")} variant="outline" className="h-20 flex-col gap-2">
              <Map className="h-6 w-6" />
              Map
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setCurrentScreen("info")} variant="ghost" className="h-12">
              <Info className="h-4 w-4 mr-2" />
              Read More
            </Button>
            <Button onClick={() => setCurrentScreen("admin")} variant="ghost" className="h-12">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      ),
    },
    camera: {
      title: "Take Photo",
      content: (
        <div className="space-y-4">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p>Camera viewfinder</p>
              <p className="text-sm opacity-75">Tap to capture</p>
            </div>
          </div>
          <div className="text-center">
            <Button size="lg" className="rounded-full w-16 h-16">
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </div>
      ),
    },
    gallery: {
      title: "Select from Gallery",
      content: (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Select an image</p>
            <p className="text-sm text-gray-500">Max 10MB • JPEG, PNG, WebP</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment (optional)</label>
            <textarea
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
              placeholder="Add a comment about your moth observation..."
            />
          </div>
        </div>
      ),
    },
    history: {
      title: "Your Observations",
      content: (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-2xl">🦋</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Moth observation #{i}</h3>
                    <p className="text-sm text-gray-600">
                      2024-01-{10 + i} • 14:3{i}
                    </p>
                    <p className="text-sm text-gray-600">59.91°N, 10.75°E</p>
                    <Badge variant="outline" className="mt-1">
                      Pending
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
    },
    map: {
      title: "Observation Map",
      content: (
        <div className="space-y-4">
          <div className="aspect-video bg-green-100 rounded-lg flex items-center justify-center relative">
            <div className="text-center">
              <Map className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="text-green-800">Interactive map</p>
              <p className="text-sm text-green-600">Showing observation locations</p>
            </div>
            {/* Mock map markers */}
            <div className="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="absolute bottom-8 right-6 w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-600 text-center">📍 3 observations plotted</p>
        </div>
      ),
    },
    info: {
      title: "About Målerjakt",
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🦋</span>
            </div>
          </div>
          <div className="space-y-4">
            <section>
              <h3 className="font-semibold mb-2">About the Project</h3>
              <p className="text-sm text-gray-600">
                Målerjakt is a citizen science project to track moth populations across Norway. Your observations help
                researchers understand biodiversity patterns.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">How to Participate</h3>
              <p className="text-sm text-gray-600">
                Simply take photos of moths you encounter and submit them with location data. Every observation
                contributes to scientific research.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-sm text-gray-600">Questions? Contact us at research@example.no</p>
            </section>
          </div>
        </div>
      ),
    },
    admin: {
      title: "Admin Dashboard",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">127</div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-sm text-gray-600">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">38</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Observation #{i}</p>
                      <p className="text-sm text-gray-600">2024-01-{10 + i}</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  }

  const currentScreenData = screens[currentScreen]

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Status bar */}
      <div className="bg-gray-900 text-white px-4 py-2 flex justify-between items-center text-sm">
        <span>9:41</span>
        <span>Målerjakt</span>
        <span>100%</span>
      </div>

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        {currentScreen !== "home" && (
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen("home")} className="mr-2 p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="font-semibold">{currentScreenData.title}</h1>
      </div>

      {/* Content */}
      <div className="p-4">{currentScreenData.content}</div>

      {/* Screen indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/80 text-white px-3 py-1 rounded-full text-xs">Screen: {currentScreen}</div>
      </div>
    </div>
  )
}
