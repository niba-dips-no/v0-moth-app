"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabase } from "@/lib/supabase/client"
import { updateObservationStatus } from "@/lib/api"
import { Loader2 } from "lucide-react"

export function DebugPanel() {
  const [observationId, setObservationId] = useState("")
  const [status, setStatus] = useState("Approved")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testUpdateStatus = async () => {
    if (!observationId) {
      setError("Please enter an observation ID")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Test direct Supabase update
      const { data, error: updateError } = await getSupabase()
        .from("observations")
        .update({
          status: status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", observationId)
        .select()

      if (updateError) {
        throw updateError
      }

      setResult({
        message: "Direct update successful",
        data,
      })
    } catch (err: any) {
      console.error("Direct update error:", err)
      setError(`Direct update failed: ${err.message || String(err)}`)

      // Try using the API function as fallback
      try {
        const updatedObs = await updateObservationStatus(observationId, status)
        setResult({
          message: "API update successful (fallback)",
          data: updatedObs,
        })
        setError(null)
      } catch (apiErr: any) {
        setError(`Both update methods failed. API error: ${apiErr.message || String(apiErr)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Admin Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="observation-id">Observation ID</Label>
            <Input
              id="observation-id"
              value={observationId}
              onChange={(e) => setObservationId(e.target.value)}
              placeholder="Enter observation ID"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <Button onClick={testUpdateStatus} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Test Update Status
          </Button>

          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

          {result && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
              <p className="font-medium">{result.message}</p>
              <pre className="mt-2 text-xs overflow-auto bg-black/5 p-2 rounded">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
