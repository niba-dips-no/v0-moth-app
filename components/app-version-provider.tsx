"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface AppVersionContextType {
  hasUpdate: boolean
}

const AppVersionContext = createContext<AppVersionContextType | undefined>(undefined)

export function AppVersionProvider({ children }: { children: React.ReactNode }) {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    // In a real app, this would check for updates
    // For now, we'll just simulate it
    const checkForUpdates = async () => {
      try {
        // Simulate API call to check for updates
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Randomly set hasUpdate to true (10% chance)
        setHasUpdate(Math.random() < 0.1)
      } catch (error) {
        console.error("Error checking for updates:", error)
      }
    }

    checkForUpdates()

    // Check for updates every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return <AppVersionContext.Provider value={{ hasUpdate }}>{children}</AppVersionContext.Provider>
}

export function useAppVersion() {
  const context = useContext(AppVersionContext)
  if (context === undefined) {
    throw new Error("useAppVersion must be used within an AppVersionProvider")
  }
  return context
}
