export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FileValidationOptions {
  maxSizeBytes?: number
  allowedTypes?: string[]
  minWidth?: number
  minHeight?: number
}

export const validateImageFile = async (file: File, options: FileValidationOptions = {}): Promise<ValidationResult> => {
  const errors: string[] = []

  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    minWidth = 100,
    minHeight = 100,
  } = options

  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
    errors.push(`File size must be less than ${maxSizeMB}MB. Current size: ${Math.round(file.size / (1024 * 1024))}MB`)
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not supported. Allowed types: ${allowedTypes.join(", ")}`)
  }

  // Check image dimensions
  try {
    const dimensions = await getImageDimensions(file)
    if (dimensions.width < minWidth || dimensions.height < minHeight) {
      errors.push(
        `Image must be at least ${minWidth}x${minHeight} pixels. Current: ${dimensions.width}x${dimensions.height}`,
      )
    }
  } catch (error) {
    errors.push("Unable to read image dimensions")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

export const validateObservationData = (data: {
  comment?: string
  latitude?: number
  longitude?: number
}): ValidationResult => {
  const errors: string[] = []

  // Validate coordinates
  if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
    errors.push("Invalid latitude. Must be between -90 and 90")
  }

  if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
    errors.push("Invalid longitude. Must be between -180 and 180")
  }

  // Validate comment length
  if (data.comment && data.comment.length > 1000) {
    errors.push("Comment must be less than 1000 characters")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "")
}
