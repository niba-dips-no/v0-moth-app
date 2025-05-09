"use client"

import { useState, useEffect } from "react"

export function useStorage() {
  const [hasStorage, setHasStorage] = useState(true)

  useEffect(() => {
    const checkStorage = async () => {
      try {
        if ("storage" in navigator && "estimate" in navigator.storage) {
          const estimate = await navigator.storage.estimate()
          const availableSpace = estimate.quota ? estimate.quota - (estimate.usage || 0) : 0

          // Consider low storage if less than 50MB available
          setHasStorage(availableSpace > 50 * 1024 * 1024)
        }
      } catch (error) {
        console.error("Error checking storage:", error)
      }
    }

    checkStorage()
  }, [])

  return { hasStorage }
}
