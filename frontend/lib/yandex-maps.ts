/**
 * Yandex Maps API utilities
 */

export interface Coordinates {
  lat: number
  lon: number
}

export interface AddressSuggestion {
  value: string
  displayName: string
  coordinates?: Coordinates
}

declare global {
  interface Window {
    ymaps: any
  }
}

export const loadYandexMaps = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'))
      return
    }

    if (window.ymaps) {
      window.ymaps.ready(() => resolve())
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => resolve())
      } else {
        reject(new Error('Yandex Maps failed to load'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load Yandex Maps script'))
    document.head.appendChild(script)
  })
}

export const geocodeAddress = async (query: string, limit: number = 5): Promise<AddressSuggestion[]> => {
  if (!window.ymaps) {
    throw new Error('Yandex Maps is not loaded')
  }

  return new Promise((resolve, reject) => {
    window.ymaps.geocode(query, { results: limit })
      .then((res: any) => {
        const suggestions: AddressSuggestion[] = []
        res.geoObjects.each((geoObject: any) => {
          const coords = geoObject.geometry.getCoordinates()
          suggestions.push({
            value: geoObject.getAddressLine(),
            displayName: geoObject.getAddressLine(),
            coordinates: { lat: coords[1], lon: coords[0] },
          })
        })
        resolve(suggestions)
      })
      .catch((error) => {
        console.error('Geocode error:', error)
        reject(error)
      })
  })
}

// Suggest API for faster autocomplete (using Yandex Geosuggest)
export const suggestAddress = async (query: string, limit: number = 5): Promise<AddressSuggestion[]> => {
  return new Promise((resolve, reject) => {
    // Use Yandex Geosuggest API (more reliable than suggest-maps)
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''
    if (!apiKey) {
      reject(new Error('Yandex Maps API key is not set'))
      return
    }

    // Use geosuggest API endpoint
    fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=${limit}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data: any) => {
        const suggestions: AddressSuggestion[] = []
        if (data.response?.GeoObjectCollection?.featureMember) {
          data.response.GeoObjectCollection.featureMember.forEach((item: any) => {
            const geoObject = item.GeoObject
            const coords = geoObject.Point.pos.split(' ').map(Number)
            suggestions.push({
              value: geoObject.metaDataProperty.GeocoderMetaData.text,
              displayName: geoObject.metaDataProperty.GeocoderMetaData.text,
              coordinates: { lat: coords[1], lon: coords[0] },
            })
          })
        }
        if (suggestions.length > 0) {
          resolve(suggestions)
        } else {
          reject(new Error('No suggestions found'))
        }
      })
      .catch((error) => {
        console.error('Geosuggest API error:', error)
        // Fallback to geocode if available
        if (window.ymaps) {
          geocodeAddress(query, limit).then(resolve).catch(reject)
        } else {
          reject(error)
        }
      })
  })
}

export const reverseGeocode = async (coordinates: Coordinates): Promise<string> => {
  if (!window.ymaps) {
    throw new Error('Yandex Maps is not loaded')
  }

  return new Promise((resolve, reject) => {
    window.ymaps.geocode([coordinates.lon, coordinates.lat])
      .then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0)
        resolve(firstGeoObject.getAddressLine())
      })
      .catch(reject)
  })
}
