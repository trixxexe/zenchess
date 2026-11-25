import { useEffect, useRef, useState } from 'react'

/**
 * Hash routing, because GitHub Pages serves static files with no rewrites.
 * In-page anchors still work: `#features` is not a route, it is left to the
 * browser to scroll, while `#/play` is.
 */
export function readRoute(hash: string): string {
  if (!hash.startsWith('#/')) return '/'
  const path = hash.slice(1)
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

export function navigate(path: string) {
  if (window.location.hash === `#${path}`) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  window.location.hash = path
}

export function useRoute(): string {
  const [route, setRoute] = useState(() => readRoute(window.location.hash))
  const previous = useRef(route)

  useEffect(() => {
    const onChange = () => {
      const next = readRoute(window.location.hash)
      setRoute(next)
      if (next !== previous.current) {
        previous.current = next
        window.scrollTo({ top: 0 })
      }
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
