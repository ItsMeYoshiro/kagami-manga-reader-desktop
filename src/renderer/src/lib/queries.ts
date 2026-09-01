import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { LIBRARY_QUERY } from '@/lib/gql/operations/library'
import { SOURCES_QUERY } from '@/lib/gql/operations/sources'
import type { LibraryQuery, SourcesQuery } from '@/lib/gql/generated/graphql'

/**
 * The queries more than one screen reads.
 *
 * Each call site used to spell out its own key and document. That worked only
 * because all five copies happened to agree: two screens sharing a key but not
 * a document would collide in the cache, and two sharing a document but not a
 * key would quietly fetch the same thing twice. Naming them once makes the
 * agreement structural instead of coincidental.
 */

/** The whole library. The rail's unread counter reads this same entry. */
export function useLibrary(): UseQueryResult<LibraryQuery> {
  return useQuery({
    queryKey: ['library'],
    queryFn: () => request<LibraryQuery>(LIBRARY_QUERY),
  })
}

/** Every source the installed extensions provide. */
export function useSources(): UseQueryResult<SourcesQuery> {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => request<SourcesQuery>(SOURCES_QUERY),
  })
}
