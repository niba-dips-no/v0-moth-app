interface ExifData {
  latitude?: number
  longitude?: number
  timestamp?: string
  make?: string
  model?: string
}

export async function extractExifData(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const dataView = new DataView(arrayBuffer)

      // Check for JPEG format
      if (dataView.getUint16(0) !== 0xffd8) {
        console.log("Not a JPEG file")
        resolve({})
        return
      }

      let offset = 2
      let marker

      // Find EXIF marker
      while (offset < dataView.byteLength) {
        marker = dataView.getUint16(offset)

        if (marker === 0xffe1) {
          // EXIF marker
          const exifLength = dataView.getUint16(offset + 2)
          const exifData = new DataView(arrayBuffer, offset + 4, exifLength - 2)

          // Check for EXIF header
          const exifHeader = new Uint8Array(arrayBuffer, offset + 4, 6)
          const exifString = String.fromCharCode(...exifHeader)

          if (exifString.startsWith("Exif\0\0")) {
            const tiffData = new DataView(arrayBuffer, offset + 10)
            const exifResult = parseTiffData(tiffData)
            resolve(exifResult)
            return
          }
        }

        if (marker === 0xffda) break // Start of scan

        const segmentLength = dataView.getUint16(offset + 2)
        offset += 2 + segmentLength
      }

      console.log("No EXIF data found")
      resolve({})
    }

    reader.onerror = () => {
      console.error("Error reading file for EXIF data")
      resolve({})
    }

    reader.readAsArrayBuffer(file)
  })
}

function parseTiffData(dataView: DataView): ExifData {
  try {
    // Check byte order
    const byteOrder = dataView.getUint16(0)
    const littleEndian = byteOrder === 0x4949

    // Get IFD offset
    const ifdOffset = dataView.getUint32(4, littleEndian)

    // Read IFD entries
    const numEntries = dataView.getUint16(ifdOffset, littleEndian)

    let latitude: number | undefined
    let longitude: number | undefined
    let latRef: string | undefined
    let lonRef: string | undefined
    let timestamp: string | undefined
    let make: string | undefined
    let model: string | undefined

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12
      const tag = dataView.getUint16(entryOffset, littleEndian)
      const type = dataView.getUint16(entryOffset + 2, littleEndian)
      const count = dataView.getUint32(entryOffset + 4, littleEndian)
      const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian)

      switch (tag) {
        case 0x8825: // GPS Info IFD
          const gpsData = parseGpsData(dataView, valueOffset, littleEndian)
          if (gpsData.latitude !== undefined) latitude = gpsData.latitude
          if (gpsData.longitude !== undefined) longitude = gpsData.longitude
          if (gpsData.latRef) latRef = gpsData.latRef
          if (gpsData.lonRef) lonRef = gpsData.lonRef
          break
        case 0x0110: // Make
          make = readString(dataView, valueOffset, count, littleEndian)
          break
        case 0x0111: // Model
          model = readString(dataView, valueOffset, count, littleEndian)
          break
        case 0x0132: // DateTime
          timestamp = readString(dataView, valueOffset, count, littleEndian)
          break
      }
    }

    // Apply GPS reference directions
    if (latitude !== undefined && latRef === "S") {
      latitude = -latitude
    }
    if (longitude !== undefined && lonRef === "W") {
      longitude = -longitude
    }

    return {
      latitude,
      longitude,
      timestamp,
      make,
      model,
    }
  } catch (error) {
    console.error("Error parsing TIFF data:", error)
    return {}
  }
}

function parseGpsData(dataView: DataView, offset: number, littleEndian: boolean) {
  try {
    const numEntries = dataView.getUint16(offset, littleEndian)

    let latitude: number | undefined
    let longitude: number | undefined
    let latRef: string | undefined
    let lonRef: string | undefined

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = offset + 2 + i * 12
      const tag = dataView.getUint16(entryOffset, littleEndian)
      const type = dataView.getUint16(entryOffset + 2, littleEndian)
      const count = dataView.getUint32(entryOffset + 4, littleEndian)
      const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian)

      switch (tag) {
        case 0x0001: // GPS Latitude Ref
          latRef = String.fromCharCode(dataView.getUint8(entryOffset + 8))
          break
        case 0x0002: // GPS Latitude
          latitude = parseGpsCoordinate(dataView, valueOffset, littleEndian)
          break
        case 0x0003: // GPS Longitude Ref
          lonRef = String.fromCharCode(dataView.getUint8(entryOffset + 8))
          break
        case 0x0004: // GPS Longitude
          longitude = parseGpsCoordinate(dataView, valueOffset, littleEndian)
          break
      }
    }

    return { latitude, longitude, latRef, lonRef }
  } catch (error) {
    console.error("Error parsing GPS data:", error)
    return {}
  }
}

function parseGpsCoordinate(dataView: DataView, offset: number, littleEndian: boolean): number {
  try {
    // GPS coordinates are stored as three rational numbers (degrees, minutes, seconds)
    const degrees = readRational(dataView, offset, littleEndian)
    const minutes = readRational(dataView, offset + 8, littleEndian)
    const seconds = readRational(dataView, offset + 16, littleEndian)

    return degrees + minutes / 60 + seconds / 3600
  } catch (error) {
    console.error("Error parsing GPS coordinate:", error)
    return 0
  }
}

function readRational(dataView: DataView, offset: number, littleEndian: boolean): number {
  const numerator = dataView.getUint32(offset, littleEndian)
  const denominator = dataView.getUint32(offset + 4, littleEndian)
  return denominator === 0 ? 0 : numerator / denominator
}

function readString(dataView: DataView, offset: number, count: number, littleEndian: boolean): string {
  try {
    const bytes = new Uint8Array(dataView.buffer, offset, count)
    return String.fromCharCode(...bytes)
      .replace(/\0/g, "")
      .trim()
  } catch (error) {
    console.error("Error reading string:", error)
    return ""
  }
}
