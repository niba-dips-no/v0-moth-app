"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { fetchObservations, updateObservationStatus } from "@/lib/api"
import { MapPin, Calendar, Clock, Smartphone, Check, X, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import Image from "next/image"

interface Observation {
  id: string
  imageUrl: string
  comment: string
  timestamp: string
  geolocation: {
    latitude: number
    longitude: number
    accuracy: number
  }
  status: string
  deviceInfo?: {
    userAgent: string
    platform: string
    language: string
  }
}

export function SubmissionsList() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
  const [filter, setFilter] = useState("all")
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadObservations()
  }, [toast])

  const loadObservations = async () => {
    try {
      setIsLoading(true)
      const data = await fetchObservations()
      setObservations(data)
    } catch (error) {
      console.error("Error fetching observations:", error)
      toast({
        title: "Error",
        description: "Failed to load observations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString()
  }

  // Update the updateStatus function to reload observations after a successful update
  const updateStatus = async (id: string, status: string) => {
    // Set loading state for this specific observation
    setUpdatingStatus((prev) => ({ ...prev, [id]: true }))

    try {
      console.log(`Updating observation ${id} to status: ${status}`)

      // Call the API to update the status in the database
      const updatedObservation = await updateObservationStatus(id, status)
      console.log("Update successful, received:", updatedObservation)

      // Update the local state
      setObservations((prev) => prev.map((obs) => (obs.id === id ? { ...obs, status } : obs)))

      toast({
        title: "Status Updated",
        description: `Observation ${id.substring(0, 8)}... marked as ${status}`,
      })

      // Close dialog if open
      if (selectedObservation?.id === id) {
        setSelectedObservation(null)
      }

      // Reload observations to ensure we have the latest data
      setTimeout(() => {
        loadObservations()
      }, 1000)
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Update Failed",
        description: `Could not update observation status: ${error}`,
        variant: "destructive",
      })
    } finally {
      // Clear loading state
      setUpdatingStatus((prev) => ({ ...prev, [id]: false }))
    }
  }

  const filteredObservations = filter === "all" ? observations : observations.filter((obs) => obs.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("submissions")}</h2>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadObservations} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredObservations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p>No observations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredObservations.map((observation) => (
            <Card key={observation.id} className="overflow-hidden">
              <div className="relative aspect-video w-full">
                <Image
                  src={observation.imageUrl || "/placeholder.svg"}
                  alt={observation.comment}
                  fill
                  className="object-cover"
                />
                <Badge
                  className="absolute top-2 right-2"
                  variant={
                    observation.status === "Approved"
                      ? "default"
                      : observation.status === "Rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {observation.status}
                </Badge>
              </div>

              <CardContent className="p-4">
                <p className="font-medium mb-2 line-clamp-1">{observation.comment}</p>

                <div className="flex flex-col gap-1 text-sm mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    {formatDate(observation.timestamp)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {observation.geolocation.latitude.toFixed(4)}, {observation.geolocation.longitude.toFixed(4)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedObservation(observation)}>
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      {selectedObservation && (
                        <>
                          <DialogHeader>
                            <DialogTitle>Observation Details</DialogTitle>
                          </DialogHeader>

                          <div className="grid gap-4 py-4 md:grid-cols-2">
                            <div className="relative aspect-square w-full">
                              <Image
                                src={selectedObservation.imageUrl || "/placeholder.svg"}
                                alt={selectedObservation.comment}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h3 className="font-medium">Comment</h3>
                                <p>{selectedObservation.comment}</p>
                              </div>

                              <div>
                                <h3 className="font-medium">Status</h3>
                                <Badge
                                  variant={
                                    selectedObservation.status === "Approved"
                                      ? "default"
                                      : selectedObservation.status === "Rejected"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {selectedObservation.status}
                                </Badge>
                              </div>

                              <div>
                                <h3 className="font-medium">Date & Time</h3>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {formatDate(selectedObservation.timestamp)}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {formatTime(selectedObservation.timestamp)}
                                </div>
                              </div>

                              <div>
                                <h3 className="font-medium">Location</h3>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {selectedObservation.geolocation.latitude.toFixed(6)},{" "}
                                  {selectedObservation.geolocation.longitude.toFixed(6)}
                                </div>
                                <div className="mt-1">
                                  <a
                                    href={`https://maps.google.com/?q=${selectedObservation.geolocation.latitude},${selectedObservation.geolocation.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm flex items-center text-blue-600 hover:underline"
                                  >
                                    View on map <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </div>
                              </div>

                              {selectedObservation.deviceInfo && (
                                <div>
                                  <h3 className="font-medium">Device Info</h3>
                                  <div className="flex items-center">
                                    <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {selectedObservation.deviceInfo.platform}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {selectedObservation.deviceInfo.userAgent}
                                  </p>
                                </div>
                              )}

                              <div>
                                <h3 className="font-medium">Image URL</h3>
                                <div className="flex items-center">
                                  <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <a
                                    href={selectedObservation.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline truncate"
                                  >
                                    {selectedObservation.imageUrl}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <div className="space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updateStatus(selectedObservation.id, "Approved")}
                                disabled={
                                  selectedObservation.status === "Approved" || updatingStatus[selectedObservation.id]
                                }
                              >
                                {updatingStatus[selectedObservation.id] ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateStatus(selectedObservation.id, "Rejected")}
                                disabled={
                                  selectedObservation.status === "Rejected" || updatingStatus[selectedObservation.id]
                                }
                              >
                                {updatingStatus[selectedObservation.id] ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(selectedObservation.id, "Pending")}
                                disabled={
                                  selectedObservation.status === "Pending" || updatingStatus[selectedObservation.id]
                                }
                              >
                                {updatingStatus[selectedObservation.id] ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                )}
                                Mark as Pending
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>

                  <div className="space-x-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStatus(observation.id, "Approved")}
                      disabled={observation.status === "Approved" || updatingStatus[observation.id]}
                    >
                      {updatingStatus[observation.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span className="sr-only">Approve</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStatus(observation.id, "Rejected")}
                      disabled={observation.status === "Rejected" || updatingStatus[observation.id]}
                    >
                      {updatingStatus[observation.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="sr-only">Reject</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Import the RefreshCw icon
import { RefreshCw } from "lucide-react"
