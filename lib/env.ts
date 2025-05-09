// Utility functions for environment variables

// Get environment variable with fallback
export function getEnv(key: string, fallback = ""): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || fallback
  }
  return fallback
}

// Get site URL with fallbacks
export function getSiteUrl(): string {
  // Try environment variables first
  const envUrl = getEnv("NEXT_PUBLIC_SITE_URL") || getEnv("NEXT_PUBLIC_APP_URL") || getEnv("NEXT_PUBLIC_VERCEL_URL")

  if (envUrl) {
    // Make sure it has a protocol
    if (!envUrl.startsWith("http")) {
      return `https://${envUrl}`
    }
    return envUrl
  }

  // If no environment variables, use client-side detection
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`
  }

  // Last resort fallback
  return "https://mothapp.vercel.app"
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return getEnv("NODE_ENV") === "development"
}

// Check if we're in production mode
export function isProduction(): boolean {
  return getEnv("NODE_ENV") === "production"
}
