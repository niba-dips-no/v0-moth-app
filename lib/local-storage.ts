export interface LocalObservation {
  id: string
  imageUrl: string
  comment: string
  timestamp: string
  geolocation: {
    latitude: number
    longitude: number
    accuracy: number
  }
  status: "Pending" | "Approved" | "Rejected"
}

const LOCAL_OBSERVATIONS_KEY = "malerjakt_observations"

export async function saveLocalObservation(observation: LocalObservation): Promise<void> {
  try {
    // Get existing observations
    const existingObservations = await getLocalObservations()

    // Add new observation
    const updatedObservations = [observation, ...existingObservations]

    // Save back to local storage
    localStorage.setItem(LOCAL_OBSERVATIONS_KEY, JSON.stringify(updatedObservations))
  } catch (error) {
    console.error("Error saving local observation:", error)
    throw error
  }
}

export async function getLocalObservations(): Promise<LocalObservation[]> {
  try {
    if (typeof window === "undefined") return []

    const data = localStorage.getItem(LOCAL_OBSERVATIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting local observations:", error)
    return []
  }
}

export async function clearLocalObservations(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_OBSERVATIONS_KEY)
  } catch (error) {
    console.error("Error clearing local observations:", error)
    throw error
  }
}

export async function removeLocalObservation(id: string): Promise<void> {
  try {
    const observations = await getLocalObservations()
    const updatedObservations = observations.filter((obs) => obs.id !== id)
    localStorage.setItem(LOCAL_OBSERVATIONS_KEY, JSON.stringify(updatedObservations))
  } catch (error) {
    console.error("Error removing local observation:", error)
    throw error
  }
}
