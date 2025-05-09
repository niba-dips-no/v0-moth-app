"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslation } from "@/hooks/use-translation"
import { FileJson } from "lucide-react"

export function ExportPanel() {
  const { t } = useTranslation()
  const [exportType, setExportType] = useState("all")
  const [includeRejected, setIncludeRejected] = useState(false)
  const [includePending, setIncludePending] = useState(false)
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)

  const handleExport = () => {
    // In a real app, this would call your API to generate and download the GeoJSON file
    console.log("Exporting with settings:", {
      exportType,
      includeRejected,
      includePending,
      includeDeviceInfo,
      includeComments,
    })

    // Simulate download
    const dummyData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "1",
            status: "Approved",
            timestamp: new Date().toISOString(),
            comment: includeComments ? "Sample comment" : undefined,
            deviceInfo: includeDeviceInfo ? { platform: "iOS" } : undefined,
          },
          geometry: {
            type: "Point",
            coordinates: [10.7522, 59.9139],
          },
        },
      ],
    }

    const dataStr = JSON.stringify(dummyData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `malerjakt-export-${new Date().toISOString().split("T")[0]}.geojson`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("export")}</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export Settings</CardTitle>
            <CardDescription>Configure what data to include in the export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium">Data to Export</h3>
              <RadioGroup defaultValue="all" value={exportType} onValueChange={setExportType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All approved submissions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date-range" id="date-range" />
                  <Label htmlFor="date-range">Date range (not implemented)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected">Selected submissions only (not implemented)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Include Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-rejected"
                    checked={includeRejected}
                    onCheckedChange={(checked) => setIncludeRejected(checked === true)}
                  />
                  <Label htmlFor="include-rejected">Include rejected submissions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-pending"
                    checked={includePending}
                    onCheckedChange={(checked) => setIncludePending(checked === true)}
                  />
                  <Label htmlFor="include-pending">Include pending submissions</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Additional Data</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-device-info"
                    checked={includeDeviceInfo}
                    onCheckedChange={(checked) => setIncludeDeviceInfo(checked === true)}
                  />
                  <Label htmlFor="include-device-info">Include device information</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-comments"
                    checked={includeComments}
                    onCheckedChange={(checked) => setIncludeComments(checked === true)}
                  />
                  <Label htmlFor="include-comments">Include comments</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
            <CardDescription>Preview of the GeoJSON export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md h-[300px] overflow-auto">
              <pre className="text-xs">
                {`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "1",
        "status": "Approved",
        "timestamp": "${new Date().toISOString()}"${
          includeComments
            ? `,
        "comment": "Found this moth in my garden"`
            : ""
        }${
          includeDeviceInfo
            ? `,
        "deviceInfo": {
          "platform": "iOS",
          "language": "en"
        }`
            : ""
        }
      },
      "geometry": {
        "type": "Point",
        "coordinates": [10.7522, 59.9139]
      }
    }
    // ... more features
  ]
}`}
              </pre>
            </div>

            <Button onClick={handleExport} className="w-full">
              <FileJson className="mr-2 h-4 w-4" />
              Export as GeoJSON
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
