import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { compareText, languageName } from '@/lib/intl'
import { useT } from '@/lib/i18n'
import { useRepository } from '@/lib/extensions/RepositoryProvider'
import { ExtensionRow, type ExtensionAction, type Source } from '@/components/ExtensionRow'
import {
  Button,
  EmptyState,
  ErrorNote,
  FilterChip,
  IconButton,
  ScreenTitle,
  SearchField,
  Select,
  TopBar,
} from '@/components/ui'
import { RefreshIcon } from '@/components/ui/Icons'
import { errorMessage } from '@/lib/format'
import {
  EXTENSIONS_QUERY,
  FETCH_EXTENSIONS_MUTATION,
  UPDATE_EXTENSION_MUTATION,
} from '@/lib/gql/operations/extensions'
import { SOURCES_QUERY } from '@/lib/gql/operations/sources'
import type {
  ExtensionsQuery,
  FetchExtensionsMutation,
  SourcesQuery,
  UpdateExtensionMutation,
} from '@/lib/gql/generated/graphql'

type Tab = 'installed' | 'updates' | 'all'

/**
 * The catalog holds ~1400 extensions. Rendering all of them jams scrolling and
 * helps nobody: the cap forces filtering, which is how the screen is meant to
 * be used.
 */
const RENDER_CAP = 120

export function Extensions(): React.ReactNode {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const repository = useRepository()
  const t = useT()
  const [tab, setTab] = useState<Tab>('installed')
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('all')

  const list = useQuery({
    queryKey: ['extensions'],
    queryFn: () => request<ExtensionsQuery>(EXTENSIONS_QUERY),
  })

  const sources = useQuery({
    queryKey: ['sources'],
    queryFn: () => request<SourcesQuery>(SOURCES_QUERY),
  })

  // An installed extension becomes one or more sources, and it is the source —
  // not the extension — that has a catalog. This index is what lets the catalog
  // be opened from here.
  const sourcesByPackage = useMemo(() => {
    const byPkg = new Map<string, Source[]>()
    for (const s of sources.data?.sources.nodes ?? []) {
      const current = byPkg.get(s.extension.pkgName)
      if (current) current.push(s)
      else byPkg.set(s.extension.pkgName, [s])
    }
    for (const group of byPkg.values()) {
      group.sort((a, b) => compareText(languageName(a.lang), languageName(b.lang)))
    }
    return byPkg
  }, [sources.data])

  const sync = useMutation({
    mutationFn: () => request<FetchExtensionsMutation>(FETCH_EXTENSIONS_MUTATION),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extensions'] }),
  })

  // One action at a time, identified by pkgName: installing kicks off an APK
  // download and a dex2jar conversion, so the button has to show it is busy.
  const [busyPkg, setBusyPkg] = useState<string | null>(null)
  const action = useMutation({
    mutationFn: (v: { id: string } & ExtensionAction) =>
      request<UpdateExtensionMutation>(UPDATE_EXTENSION_MUTATION, {
        id: v.id,
        install: v.install ?? null,
        uninstall: v.uninstall ?? null,
        update: v.update ?? null,
      }),
    onSettled: () => {
      setBusyPkg(null)
      void qc.invalidateQueries({ queryKey: ['extensions'] })
      // Installing or removing an extension changes Browse's source list.
      void qc.invalidateQueries({ queryKey: ['sources'] })
    },
  })

  const run = (id: string, patch: ExtensionAction): void => {
    setBusyPkg(id)
    action.mutate({ id, ...patch })
  }

  // `from` marks where the catalog screen's back button should return to. It
  // goes in the URL rather than router state so it survives a reload.
  const openSource = (sourceId: string): void => {
    navigate(`/browse/${sourceId}?from=extensions`)
  }

  // A single-source extension opens straight away; with several, expand so the
  // user picks a language. One extra click only where a choice really exists.
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null)
  const openCatalog = (pkgName: string): void => {
    const its = sourcesByPackage.get(pkgName) ?? []
    if (its.length === 0) return
    if (its.length === 1) openSource(its[0].id)
    else setExpandedPkg((p) => (p === pkgName ? null : pkgName))
  }

  const all = list.data?.extensions.nodes ?? []

  const languages = useMemo(() => [...new Set(all.map((e) => e.lang))].sort(), [all])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return all
      .filter((e) => {
        if (tab === 'installed' && !e.isInstalled) return false
        if (tab === 'updates' && !e.hasUpdate) return false
        if (language !== 'all' && e.lang !== language) return false
        if (term && !e.name.toLowerCase().includes(term)) return false
        return true
      })
      .sort((a, b) => compareText(a.name, b.name))
  }, [all, tab, language, search])

  const counts = useMemo(
    () => ({
      installed: all.filter((e) => e.isInstalled).length,
      updates: all.filter((e) => e.hasUpdate).length,
      all: all.length,
    }),
    [all],
  )

  const TABS: { id: Tab; label: string }[] = [
    { id: 'installed', label: t('ext.tab.installed', { n: counts.installed }) },
    { id: 'updates', label: t('ext.tab.updates', { n: counts.updates }) },
    { id: 'all', label: t('ext.tab.available', { n: counts.all }) },
  ]

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <ScreenTitle>{t('ext.title')}</ScreenTitle>

        <div className="flex-1" />

        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('ext.searchPlaceholder')}
          className="w-52"
        />

        <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="all">{t('ext.allLanguages')}</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>

        <IconButton
          label={sync.isPending ? t('ext.syncing') : t('ext.sync')}
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
        >
          <RefreshIcon className={sync.isPending ? 'animate-spin' : ''} />
        </IconButton>
      </TopBar>

      <div className="flex shrink-0 gap-2 bg-surface px-6 pb-3">
        {TABS.map((item) => (
          <FilterChip key={item.id} active={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </FilterChip>
        ))}
      </div>

      {repository.error ? (
        <ErrorNote>
          {t('ext.repoError', {
            name: repository.name,
            error: errorMessage(repository.error),
          })}{' '}
          <button onClick={repository.retry} className="font-medium underline">
            {t('ext.repoRetry')}
          </button>
        </ErrorNote>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.isLoading || repository.registering ? (
          <p className="p-6 text-[13px] text-txt3">
            {repository.registering ? t('ext.loadingCatalog') : t('ext.loading')}
          </p>
        ) : list.error ? (
          <ErrorNote>{(list.error as Error).message}</ErrorNote>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? t('ext.empty.none') : t('ext.empty.filtered')}
            body={
              all.length === 0
                ? t('ext.empty.noneBody', { name: repository.name })
                : t('ext.empty.filteredBody')
            }
            action={
              all.length === 0 ? (
                <Button tone="primary" onClick={() => sync.mutate()}>
                  {t('ext.empty.action')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul>
              {filtered.slice(0, RENDER_CAP).map((e) => (
                <ExtensionRow
                  key={e.pkgName}
                  extension={e}
                  sources={sourcesByPackage.get(e.pkgName) ?? []}
                  expanded={expandedPkg === e.pkgName}
                  busy={busyPkg === e.pkgName}
                  onOpenCatalog={openCatalog}
                  onOpenSource={openSource}
                  onRun={run}
                />
              ))}
            </ul>
            {filtered.length > RENDER_CAP ? (
              <p className="px-6 py-4 text-xs text-txt3">
                {t('ext.capped', { n: RENDER_CAP, total: filtered.length })}
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* The repository is the app's choice, so this is information, not a control. */}
      <p className="shrink-0 bg-surface px-6 py-2 text-[11px] text-txt3">
        {t('ext.footer', { name: repository.name })}
        {repository.registering ? t('ext.footerRegistering') : ''}
      </p>
    </div>
  )
}
