"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface NetworkStatusContextType {
  isOnline: boolean
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined)

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return

    // Set initial state
    setIsOnline(navigator.onLine)

    // Add event listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return <NetworkStatusContext.Provider value={{ isOnline }}>{children}</NetworkStatusContext.Provider>
}

export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext)
  if (context === undefined) {
    throw new Error("useNetworkStatus must be used within a NetworkStatusProvider")
  }
  return context
}
