import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { limitSearch } from '@/lib/concurrency'
import { compareText, languageName } from '@/lib/intl'
import { useLanguage } from '@/lib/i18n'
import { SourceRow, PER_SOURCE } from '@/components/SourceRow'
import { Button, EmptyState, ScreenTitle, SearchField, Select, TopBar } from '@/components/ui'
import type { MangaCard } from '@/components/MangaGrid'
import type { SearchSourceMutation, SourcesQuery } from '@/lib/gql/generated/graphql'
import {
  SOURCES_QUERY,
  SEARCH_SOURCE_MUTATION,
  POPULAR_SOURCE_MUTATION,
} from '@/lib/gql/operations/sources'

/** Which source language the user last browsed. Not the UI language. */
const SOURCE_LANGUAGE_KEY = 'kagami.browse.lang'

function storedSourceLanguage(): string {
  try {
    return localStorage.getItem(SOURCE_LANGUAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

/**
 * Global search: one term, every installed source in the chosen language.
 *
 * Each source becomes a row with its first results and a "see more" that opens
 * that source's full catalog. Hunting for a title without knowing beforehand
 * which source carries it was the main friction of the previous screen.
 */
export function Browse(): React.ReactNode {
  // Search and language live in the URL: stepping into a "see more" and coming
  // back must not throw away what the user searched for.
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const query = params.get('q') ?? ''
  const languageParam = params.get('lang') ?? ''
  const [term, setTerm] = useState(query)

  useEffect(() => {
    setTerm(query)
  }, [query])

  const wanted = languageParam || storedSourceLanguage()

  const sources = useQuery({
    queryKey: ['sources'],
    queryFn: () => request<SourcesQuery>(SOURCES_QUERY),
  })

  // The local source (id 0) is not browsable like the remote ones; leave it out.
  const remote = useMemo(
    () => (sources.data?.sources.nodes ?? []).filter((s) => s.id !== '0'),
    [sources.data],
  )

  const languages = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of remote) counts.set(s.lang, (counts.get(s.lang) ?? 0) + 1)
    return [...counts.entries()]
      .map(([code, n]) => ({ code, n, name: languageName(code) }))
      // Most sources first: those are the languages where global search pays off.
      .sort((a, b) => b.n - a.n || compareText(a.name, b.name))
    // `language` matters: both the names and their order come from it.
  }, [remote, language])

  const known = languages.some((l) => l.code === wanted)
  const activeLanguage = (known ? wanted : '') || languages[0]?.code || ''

  const changeLanguage = (code: string): void => {
    const next: Record<string, string> = { lang: code }
    if (query) next.q = query
    setParams(next, { replace: true })
  }

  useEffect(() => {
    if (!activeLanguage) return
    try {
      localStorage.setItem(SOURCE_LANGUAGE_KEY, activeLanguage)
    } catch {
      /* preference not persisted; no reason to break navigation */
    }
  }, [activeLanguage])

  const sourcesInLanguage = useMemo(
    () => remote.filter((s) => s.lang === activeLanguage),
    [remote, activeLanguage],
  )

  // One query per source: a source that fails does not take the others down,
  // and each row appears as soon as its own answer arrives.
  const results = useQueries({
    queries: sourcesInLanguage.map((s) => ({
      queryKey: ['global-search', s.id, query],
      enabled: !!activeLanguage,
      queryFn: () =>
        limitSearch(() =>
          query
            ? request<SearchSourceMutation>(SEARCH_SOURCE_MUTATION, {
                source: s.id,
                query,
                page: 1,
              })
            : request<SearchSourceMutation>(POPULAR_SOURCE_MUTATION, {
                source: s.id,
                page: 1,
              }),
        ),
      retry: false,
    })),
  })

  const searching = results.some((r) => r.isFetching)
  const withResults = results.filter((r) => (r.data?.fetchSourceManga?.mangas.length ?? 0) > 0)

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <ScreenTitle>{t('browse.title')}</ScreenTitle>

        <Select
          value={activeLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          className="max-w-56"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name} ({l.n})
            </option>
          ))}
        </Select>

        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const v = term.trim()
            const next: Record<string, string> = { lang: activeLanguage }
            if (v) next.q = v
            setParams(next, { replace: true })
          }}
        >
          <SearchField
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('browse.placeholder')}
            className="flex-1"
          />
          <Button tone="primary" type="submit" disabled={sourcesInLanguage.length === 0}>
            {t('browse.search')}
          </Button>
        </form>

        <span className="tnum shrink-0 text-xs text-txt3">
          {searching
            ? t('browse.progress', {
                done: results.filter((r) => !r.isFetching).length,
                total: sourcesInLanguage.length,
              })
            : t('browse.results', {
                withResults: withResults.length,
                total: sourcesInLanguage.length,
              })}
        </span>
      </TopBar>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sources.isLoading ? (
          <p className="p-6 text-[13px] text-txt3">{t('browse.loadingSources')}</p>
        ) : remote.length === 0 ? (
          <EmptyState
            title={t('browse.noSources.title')}
            body={t('browse.noSources.body')}
            action={
              <Button tone="primary" onClick={() => navigate('/extensions')}>
                {t('browse.noSources.action')}
              </Button>
            }
          />
        ) : (
          sourcesInLanguage.map((s, i) => {
            const r = results[i]
            return (
              <SourceRow
                key={s.id}
                name={s.displayName}
                iconUrl={s.iconUrl}
                sourceId={s.id}
                term={query}
                items={
                  (r?.data?.fetchSourceManga?.mangas ?? []).slice(0, PER_SOURCE) as MangaCard[]
                }
                loading={r?.isFetching ?? false}
                error={r?.error as Error | undefined}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
