import { useEffect, useState } from 'react'

export //Hook IsMobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)') // Tailwind `sm`
    setIsMobile(mediaQuery.matches)

    const handler = () => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isMobile
}
