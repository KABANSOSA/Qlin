'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MapPin, Search, Check } from 'lucide-react'

interface CitySelectorProps {
  value: string
  onChange: (city: string) => void
  error?: string
  placeholder?: string
}

const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
  'Уфа',
  'Красноярск',
  'Воронеж',
  'Пермь',
  'Волгоград',
  'Краснодар',
  'Саратов',
  'Тюмень',
  'Тольятти',
  'Ижевск',
  'Барнаул',
  'Ульяновск',
  'Иркутск',
  'Хабаровск',
  'Ярославль',
  'Владивосток',
  'Махачкала',
  'Томск',
  'Оренбург',
  'Кемерово',
]

export function CitySelector({
  value,
  onChange,
  error,
  placeholder = 'Начните вводить название города',
}: CitySelectorProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const filterCities = (query: string): string[] => {
    if (!query || query.length < 1) {
      return []
    }
    const lowerQuery = query.toLowerCase()
    return CITIES.filter(city => 
      city.toLowerCase().includes(lowerQuery)
    ).slice(0, 8)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)

    if (newValue.length >= 1) {
      const filtered = filterCities(newValue)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectCity = (city: string) => {
    setInputValue(city)
    onChange(city)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectCity(suggestions[selectedIndex])
        } else if (suggestions.length === 1) {
          handleSelectCity(suggestions[0])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleFocus = () => {
    if (inputValue.length >= 1) {
      const filtered = filterCities(inputValue)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    }
  }

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  const isExactMatch = value && CITIES.includes(value)

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-opacity duration-200" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-10 pr-10 h-12 border-2 transition-all duration-200 text-base ${
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : isExactMatch
              ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-400'
          } ${showSuggestions ? 'rounded-t-lg rounded-b-none' : 'rounded-lg'} shadow-sm hover:shadow-md`}
        />
        {isExactMatch && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-0 max-h-64 overflow-y-auto shadow-2xl border-2 border-blue-200 rounded-b-lg rounded-t-none animate-slide-down bg-white">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-1">
              Выберите город из списка
            </div>
            {suggestions.map((city, index) => (
              <button
                key={city}
                type="button"
                onClick={() => handleSelectCity(city)}
                onMouseDown={(e) => e.preventDefault()}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 active:bg-blue-100 rounded-lg flex items-center gap-3 transition-all duration-200 group animate-fade-in cursor-pointer ${
                  index === selectedIndex ? 'bg-blue-100' : ''
                }`}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 flex-shrink-0 ${
                  index === selectedIndex 
                    ? 'bg-blue-200' 
                    : 'bg-blue-100 group-hover:bg-blue-200'
                }`}>
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 block truncate">
                    {city}
                  </span>
                </div>
                {index === selectedIndex && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <p className="text-xs text-destructive mt-1.5 flex items-center gap-1.5 animate-fade-in">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </p>
      )}

      {isExactMatch && (
        <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5 animate-fade-in">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Город выбран: <strong>{value}</strong></span>
        </p>
      )}
    </div>
  )
}
