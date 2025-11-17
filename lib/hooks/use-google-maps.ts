import { useEffect, useState } from 'react'

interface UseGoogleMapsResult {
  isLoaded: boolean
  error: string | null
}

declare global {
  interface Window {
    google: any
  }
}

// Global promise to track script loading
let scriptLoadPromise: Promise<void> | null = null

export function useGoogleMaps(): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadGoogleMaps = async () => {
      // If already loaded, return immediately
      if (window.google?.maps) {
        setIsLoaded(true)
        return
      }

      // If script is already being loaded, wait for it
      if (scriptLoadPromise) {
        try {
          await scriptLoadPromise
          setIsLoaded(true)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load Google Maps')
        }
        return
      }

      // Check if script tag already exists
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      ) as HTMLScriptElement | null

      if (existingScript) {
        // Script tag exists, wait for it to load
        if (window.google?.maps) {
          setIsLoaded(true)
          return
        }

        // Create a promise that waits for the existing script to load
        scriptLoadPromise = new Promise((resolve, reject) => {
          const checkLoaded = () => {
            if (window.google?.maps) {
              resolve()
            }
          }

          // Check immediately
          checkLoaded()

          // If not loaded yet, check periodically
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 100)

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval)
            if (!window.google?.maps) {
              reject(new Error('Google Maps failed to load'))
            }
          }, 10000)

          // Also listen to the script's load event if it hasn't fired yet
          if (existingScript.readyState === 'loading') {
            existingScript.addEventListener('load', checkLoaded)
            existingScript.addEventListener('error', () => {
              clearInterval(checkInterval)
              reject(new Error('Failed to load Google Maps script'))
            })
          }
        })

        try {
          await scriptLoadPromise
          setIsLoaded(true)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load Google Maps')
        }
        return
      }

      // Create new script load promise
      scriptLoadPromise = new Promise(async (resolve, reject) => {
        try {
          const response = await fetch('/api/maps-config')
          const data = await response.json()

          if (!data.apiKey) {
            reject(new Error('Maps API key not configured'))
            return
          }

          const script = document.createElement('script')
          script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`
          script.async = true
          script.defer = true
          script.onload = () => {
            if (window.google?.maps) {
              resolve()
            } else {
              reject(new Error('Google Maps failed to initialize'))
            }
          }
          script.onerror = () => {
            reject(new Error('Failed to load Google Maps script'))
          }

          document.head.appendChild(script)
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to load Google Maps'))
        }
      })

      try {
        await scriptLoadPromise
        setIsLoaded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps')
        scriptLoadPromise = null // Reset on error so it can retry
      }
    }

    loadGoogleMaps()
  }, [])

  return { isLoaded, error }
}

