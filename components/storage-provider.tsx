"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface StorageContextType {
  hasStorage: boolean
}

const StorageContext = createContext<StorageContextType | undefined>(undefined)

export function StorageProvider({ children }: { children: React.ReactNode }) {
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

  return <StorageContext.Provider value={{ hasStorage }}>{children}</StorageContext.Provider>
}

export function useStorage() {
  const context = useContext(StorageContext)
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider")
  }
  return context
}
