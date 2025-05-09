"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function FixPoliciesButton() {
  const [isFixing, setIsFixing] = useState(false)
  const { toast } = useToast()

  const handleFixPolicies = async () => {
    setIsFixing(true)
    try {
      // Execute the SQL to fix policies
      const { error } = await getSupabase().rpc("fix_recursive_policies")

      if (error) {
        throw error
      }

      toast({
        title: "Policies Fixed",
        description: "Database policies have been updated successfully",
      })
    } catch (error) {
      console.error("Error fixing policies:", error)
      toast({
        title: "Error",
        description: `Failed to fix policies: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleFixPolicies} disabled={isFixing}>
      {isFixing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
      Fix Database Policies
    </Button>
  )
}
