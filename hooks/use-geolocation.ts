"use client"

import { useState, useEffect } from "react"

export function useGeolocation() {
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

  return { hasGeolocation, position, error }
}
