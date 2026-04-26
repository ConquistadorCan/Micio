import { useEffect, useState } from 'react'
import { useApi } from '@/services/api'
import type { UserMinimal } from '@micio/shared'

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 250

export function useUserSearch() {
  const { apiFetch } = useApi()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserMinimal[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const normalizedQuery = query.trim()

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const timer = window.setTimeout(async () => {
      try {
        const data = await apiFetch<{ users: UserMinimal[] }>(
          `/api/users/search?q=${encodeURIComponent(normalizedQuery)}`,
          'GET',
          undefined,
          { signal: controller.signal },
        )
        setResults(data.users)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResults([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, apiFetch])

  return {
    query,
    setQuery,
    results,
    loading,
    hasEnoughQuery: query.trim().length >= MIN_QUERY_LENGTH,
  }
}
