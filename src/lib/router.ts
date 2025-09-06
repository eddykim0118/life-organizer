import { useEffect, useState } from 'react'

export type Route = 'dashboard' | 'calendar' | 'tasks' | 'routines' | 'finance' | 'suggestions' | 'settings'

function getRouteFromHash(): Route {
  const hash = window.location.hash.replace('#/', '')
  const r = (hash || 'dashboard') as Route
  return r
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(getRouteFromHash())
  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const navigate = (r: Route) => {
    if (r !== route) window.location.hash = `#/${r}`
  }
  return [route, navigate]
}


