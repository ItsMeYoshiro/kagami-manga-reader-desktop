import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { assetUrl, request } from '@/lib/gql/client'
import { useSources } from '@/lib/queries'
import { MangaGrid, type MangaCard } from '@/components/MangaGrid'
import { Button, EmptyState, ErrorNote, IconButton, SearchField, TopBar } from '@/components/ui'
import { BackIcon } from '@/components/ui/Icons'
import { useT } from '@/lib/i18n'
import type { SearchSourceMutation } from '@/lib/gql/generated/graphql'
import {
  SEARCH_SOURCE_MUTATION,
  POPULAR_SOURCE_MUTATION,
} from '@/lib/gql/operations/sources'

/**
 * One source's full catalog, with infinite scrolling.
 *
 * There are two doors into this screen: the "see more" of global search, and
 * clicking an installed extension.
 */
export function BrowseSource(): React.ReactNode {
  const { sourceId = '' } = useParams<{ sourceId: string }>()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const t = useT()

  const query = params.get('q') ?? ''
  // Two doors lead here, so back has to return the user to the one they used.
  const from = params.get('from') ?? ''
  const fromExtensions = from === 'extensions'
  const [term, setTerm] = useState(query)

  // The term arrives in the URL when coming from "see more"; keeping the two in
  // sync stops the field from showing one thing and the list another.
  useEffect(() => {
    setTerm(query)
  }, [query])

  const sources = useSources()
  const source = sources.data?.sources.nodes.find((s) => s.id === sourceId)

  const list = useInfiniteQuery({
    queryKey: ['browse', sourceId, query],
    enabled: !!sourceId,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      query
        ? request<SearchSourceMutation>(SEARCH_SOURCE_MUTATION, {
            source: sourceId,
            query,
            page: pageParam,
          })
        : request<SearchSourceMutation>(POPULAR_SOURCE_MUTATION, {
            source: sourceId,
            page: pageParam,
          }),
    getNextPageParam: (last, all) =>
      last.fetchSourceManga?.hasNextPage ? all.length + 1 : undefined,
  })

  // Sources repeat entries across pages fairly often; without deduping, the
  // grid would grow duplicate cards and React would complain about keys.
  const items = useMemo<MangaCard[]>(() => {
    const seen = new Set<number>()
    const out: MangaCard[] = []
    for (const page of list.data?.pages ?? []) {
      for (const m of page.fetchSourceManga?.mangas ?? []) {
        if (seen.has(m.id)) continue
        seen.add(m.id)
        out.push(m)
      }
    }
    return out
  }, [list.data])

  const sentinel = useRef<HTMLDivElement>(null)
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = list
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      // Start loading before the user reaches the end of the grid.
      { rootMargin: '400px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <IconButton
          label={fromExtensions ? t('catalog.backToExtensions') : t('catalog.backToSearch')}
          // Going back to global search takes the term along: back must not mean
          // starting the search over.
          onClick={() =>
            fromExtensions
              ? navigate('/extensions')
              : navigate(query ? `/browse?q=${encodeURIComponent(query)}` : '/browse')
          }
        >
          <BackIcon />
        </IconButton>

        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-md bg-raised2">
          {source?.iconUrl ? (
            <img src={assetUrl(source.iconUrl)} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <h1
          className="shrink-0 truncate font-display text-lg leading-tight text-txt"
          title={source?.displayName}
        >
          {source?.displayName ?? t('catalog.source')}
        </h1>

        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const v = term.trim()
            // `from` has to survive a search made here, or back would change
            // destination mid-navigation.
            const next: Record<string, string> = {}
            if (v) next.q = v
            if (from) next.from = from
            setParams(next, { replace: true })
          }}
        >
          <SearchField
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('catalog.placeholder')}
            className="flex-1"
          />
          <Button tone="primary" type="submit">
            {t('browse.search')}
          </Button>
        </form>

        {items.length > 0 ? (
          <span className="tnum shrink-0 text-xs text-txt3">
            {items.length}
            {hasNextPage ? '+' : ''}
          </span>
        ) : null}
      </TopBar>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.isError ? (
          <ErrorNote>{(list.error as Error).message}</ErrorNote>
        ) : list.isPending ? (
          <p className="p-6 text-[13px] text-txt3">{t('catalog.loading')}</p>
        ) : items.length === 0 ? (
          <EmptyState
            title={t('catalog.empty.title')}
            body={query ? t('catalog.empty.searched') : t('catalog.empty.popular')}
          />
        ) : (
          <>
            <MangaGrid items={items} />
            <div ref={sentinel} className="h-px" />
            {isFetchingNextPage ? (
              <p className="px-6 pb-6 text-center text-xs text-txt3">{t('catalog.loadingMore')}</p>
            ) : !hasNextPage ? (
              <p className="px-6 pb-6 text-center text-xs text-txt3">{t('catalog.end')}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
