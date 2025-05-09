"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface GeolocationContextType {
  hasGeolocation: boolean
  position: GeolocationPosition | null
  error: GeolocationPositionError | null
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined)

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const [hasGeolocation, setHasGeolocation] = useState(true)
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setHasGeolocation(false)
      return
    }

    const successHandler = (position: GeolocationPosition) => {
      setPosition(position)
      setHasGeolocation(true)
      setError(null)
    }

    const errorHandler = (error: GeolocationPositionError) => {
      setError(error)
      setHasGeolocation(false)
    }

    const id = navigator.geolocation.watchPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })

    return () => {
      navigator.geolocation.clearWatch(id)
    }
  }, [])

  return (
    <GeolocationContext.Provider value={{ hasGeolocation, position, error }}>{children}</GeolocationContext.Provider>
  )
}

export function useGeolocation() {
  const context = useContext(GeolocationContext)
  if (context === undefined) {
    throw new Error("useGeolocation must be used within a GeolocationProvider")
  }
  return context
}
