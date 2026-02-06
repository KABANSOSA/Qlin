'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MapPin, X, Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadYandexMaps, geocodeAddress, reverseGeocode, type AddressSuggestion } from '@/lib/yandex-maps'

interface AddressSelectorProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lon: number }) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  city?: string
}

export function AddressSelector({
  value,
  onChange,
  error,
  placeholder = 'Введите адрес или выберите на карте',
  disabled = false,
  city,
}: AddressSelectorProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [isMapsLoaded, setIsMapsLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Load Yandex Maps script
  useEffect(() => {
    // Try multiple ways to get API key (for Docker and local dev)
    const apiKey = 
      process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || 
      (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_YANDEX_MAPS_API_KEY) ||
      ''
    
    console.log('Yandex Maps API Key present:', !!apiKey)
    console.log('API Key length:', apiKey.length)
    console.log('API Key first 10 chars:', apiKey.substring(0, 10))
    
    if (apiKey && apiKey.length > 10) {
      loadYandexMaps(apiKey)
        .then(() => {
          console.log('Yandex Maps loaded successfully')
          setIsMapsLoaded(true)
        })
        .catch((err) => {
          console.error('Failed to load Yandex Maps:', err)
          // Still allow fallback suggestions
          setIsMapsLoaded(false)
        })
    } else {
      console.warn('YANDEX_MAPS_API_KEY is not set or too short - using fallback mode')
      console.warn('Current value:', apiKey || '(empty)')
      setIsMapsLoaded(false)
    }
  }, [])

  // Debounced geocode address suggestions
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (!city) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Build search query with city
    const searchQuery = city ? `${query}, ${city}` : query

    // Always show at least one suggestion immediately
    const immediateSuggestion: AddressSuggestion = {
      value: `${query}, ${city}`,
      displayName: `${query}, ${city}`,
      coordinates: undefined
    }
    
    // Show immediate suggestion first
    setSuggestions([immediateSuggestion])
    setShowSuggestions(true)

    // If maps not loaded, just show the immediate suggestion
    if (!isMapsLoaded || !window.ymaps) {
      console.log('Maps not loaded, showing fallback suggestion')
      return
    }

    // Try to get real suggestions from API
    try {
      console.log('Searching address via API:', searchQuery)
      const results = await geocodeAddress(searchQuery, 5)
      console.log('Geocode API results:', results.length, 'items')
      
      if (results.length > 0) {
        // Replace with real results
        console.log('Replacing with API results')
        setSuggestions(results)
        setShowSuggestions(true)
      } else {
        console.log('API returned no results, keeping fallback')
        // Keep the immediate suggestion
      }
    } catch (error) {
      console.error('Address search error:', error)
      // Keep the immediate suggestion on error
    }
  }

  // Debounce search
  useEffect(() => {
    if (value.length < 3 || !city) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Show immediate suggestion while waiting for API
    const immediateSuggestion: AddressSuggestion = {
      value: `${value}, ${city}`,
      displayName: `${value}, ${city}`,
      coordinates: undefined
    }
    setSuggestions([immediateSuggestion])
    setShowSuggestions(true)

    const timeoutId = setTimeout(() => {
      searchAddress(value).catch((error) => {
        console.error('Search address error:', error)
        // Keep the immediate suggestion on error
      })
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [value, isMapsLoaded, city])

  // Initialize map
  useEffect(() => {
    if (isMapOpen && mapRef.current && isMapsLoaded && window.ymaps) {
      window.ymaps.ready(() => {
        if (!mapInstanceRef.current) {
          const center = selectedCoordinates
            ? [selectedCoordinates.lon, selectedCoordinates.lat]
            : [37.573856, 55.751574] // Moscow default

          // Get city center if city is provided
          let mapCenter = center
          if (city && !selectedCoordinates) {
            // Try to geocode city to get its center
            window.ymaps.geocode(city).then((res: any) => {
              const firstGeoObject = res.geoObjects.get(0)
              if (firstGeoObject) {
                const cityCoords = firstGeoObject.geometry.getCoordinates()
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setCenter(cityCoords, 12)
                }
              }
            }).catch(() => {
              // Use default center if city geocoding fails
            })
          }

          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center: mapCenter,
            zoom: city ? 12 : 15,
            controls: ['zoomControl', 'geolocationControl'],
          })

          // Add click handler
          mapInstanceRef.current.events.add('click', async (e: any) => {
            const coords = e.get('coords')
            const coordinates = { lat: coords[1], lon: coords[0] }
            setSelectedCoordinates(coordinates)
            setShowSuggestions(false) // Hide suggestions when map is clicked

            try {
              const address = await reverseGeocode(coordinates)
              onChange(address, coordinates)
              // Update input value
              if (inputRef.current) {
                inputRef.current.value = address
              }
            } catch (error) {
              console.error('Reverse geocoding error:', error)
            }

            // Update marker
            if (markerRef.current) {
              markerRef.current.geometry.setCoordinates(coords)
            } else {
              markerRef.current = new window.ymaps.Placemark(
                coords,
                {},
                {
                  preset: 'islands#blueDotIcon',
                  draggable: true,
                }
              )
              mapInstanceRef.current.geoObjects.add(markerRef.current)

              // Handle marker drag
              markerRef.current.events.add('dragend', async () => {
                const newCoords = markerRef.current.geometry.getCoordinates()
                const coordinates = { lat: newCoords[1], lon: newCoords[0] }
                setSelectedCoordinates(coordinates)
                try {
                  const address = await reverseGeocode(coordinates)
                  onChange(address, coordinates)
                } catch (error) {
                  console.error('Reverse geocoding error:', error)
                }
              })
            }
          })
        }
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [isMapOpen, isMapsLoaded, selectedCoordinates, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    // Clear coordinates when user types
    setSelectedCoordinates(null)
    // searchAddress will be called via useEffect debounce
  }

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    // Prevent multiple clicks
    if (showSuggestions === false) return
    
    setShowSuggestions(false)
    inputRef.current?.blur()
    
    // If coordinates are already available, use them
    if (suggestion.coordinates) {
      onChange(suggestion.value, suggestion.coordinates)
      setSelectedCoordinates(suggestion.coordinates)
      // Update map if open
      if (mapInstanceRef.current && markerRef.current) {
        const coords = [suggestion.coordinates.lon, suggestion.coordinates.lat]
        mapInstanceRef.current.setCenter(coords, 15)
        markerRef.current.geometry.setCoordinates(coords)
      }
      return
    }

    // If coordinates are not available, try to geocode the address (only once)
    if (isMapsLoaded && window.ymaps) {
      try {
        const results = await geocodeAddress(suggestion.value, 1)
        if (results.length > 0 && results[0].coordinates) {
          const coords = results[0].coordinates
          onChange(suggestion.value, coords)
          setSelectedCoordinates(coords)
          // Update map if open
          if (mapInstanceRef.current && markerRef.current) {
            const mapCoords = [coords.lon, coords.lat]
            mapInstanceRef.current.setCenter(mapCoords, 15)
            markerRef.current.geometry.setCoordinates(mapCoords)
          }
        } else {
          // Fallback: use address without coordinates
          onChange(suggestion.value, undefined)
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        // Fallback: use address without coordinates
        onChange(suggestion.value, undefined)
      }
    } else {
      // If maps not loaded, just use the address
      onChange(suggestion.value, undefined)
    }
  }

  const handleMapToggle = () => {
    setIsMapOpen(!isMapOpen)
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-opacity duration-200" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={() => {
              // Trigger search if value exists and city is selected
              if (value.length >= 3 && city) {
                searchAddress(value).catch(console.error)
              } else if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => {
              // Delay hiding to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`pl-10 pr-20 transition-all duration-200 ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''} ${error ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMapToggle}
            disabled={disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-xs transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MapPin className="h-4 w-4 mr-1 transition-transform duration-200 group-hover:scale-110" />
            {isMapOpen ? 'Скрыть карту' : 'На карте'}
          </Button>
        </div>

        {/* Suggestions dropdown with smooth animations */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute z-[100] w-full mt-2 max-h-60 overflow-y-auto shadow-2xl border-2 animate-slide-down bg-white" style={{ top: '100%' }}>
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg flex items-start gap-3 transition-all duration-200 group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200 flex-shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 block truncate">
                      {suggestion.displayName}
                    </span>
                    {suggestion.coordinates && (
                      <span className="text-xs text-gray-500 mt-0.5 block">
                        {suggestion.coordinates.lat.toFixed(4)}, {suggestion.coordinates.lon.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Map with smooth animation */}
      {isMapOpen && (
        <Card className="mt-4 border-2 shadow-xl animate-slide-down bg-white/95 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Выберите адрес на карте
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMapOpen(false)}
                className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div
              ref={mapRef}
              className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200 shadow-inner transition-all duration-300"
              style={{ minHeight: '384px' }}
            />
            {selectedCoordinates && (
              <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200 animate-fade-in">
                <span className="font-medium">Координаты:</span> {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lon.toFixed(6)}
              </div>
            )}
          </div>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
