import { useState, useRef, useEffect } from 'react'
import { FOURNISSEURS } from '../data/fournisseurs.js'

export default function AutocompleteInput({ value, onChange, placeholder, className = '' }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  function handleChange(e) {
    const val = e.target.value
    onChange(val)
    if (val.length >= 2) {
      setSuggestions(FOURNISSEURS.filter(f => f.toLowerCase().includes(val.toLowerCase())))
    } else {
      setSuggestions([])
    }
  }

  function handleSelect(val) {
    onChange(val)
    setShowSuggestions(false)
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => {
          setShowSuggestions(false)
          if (valueRef.current && !FOURNISSEURS.includes(valueRef.current)) {
            onChange('')
          }
        }, 150)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#2d4a6b]/20 focus:border-[#2d4a6b] placeholder-stone-500"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-stone-50 border border-stone-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map(f => (
            <li
              key={f}
              onClick={() => handleSelect(f)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-stone-100"
            >
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
