import { useNavigate } from 'react-router-dom'
import { assetUrl } from '@/lib/gql/client'
import { errorMessage } from '@/lib/format'
import { CoverCard, type MangaCard } from '@/components/MangaGrid'
import { useT } from '@/lib/i18n'

/** How many results each source shows before the "see more". */
export const PER_SOURCE = 5

/**
 * One source's row of results in global search.
 *
 * Each source has its own state: one can fail (site down, Cloudflare) while the
 * others answer normally. That is why the error is shown inside the row instead
 * of taking over the whole screen.
 */
export function SourceRow({
  name,
  iconUrl,
  sourceId,
  term,
  items,
  loading,
  error,
}: {
  name: string
  iconUrl?: string | null
  sourceId: string
  term: string
  items: MangaCard[]
  loading: boolean
  error?: Error
}): React.ReactNode {
  const navigate = useNavigate()
  const t = useT()

  const seeMore = (): void => {
    const q = term ? `?q=${encodeURIComponent(term)}` : ''
    navigate(`/browse/${sourceId}${q}`)
  }

  return (
    <section className="border-b border-line/40 px-6 py-4 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-md bg-raised2">
          {iconUrl ? (
            <img src={assetUrl(iconUrl)} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <h2 className="min-w-0 truncate font-display text-[15px] text-txt" title={name}>
          {name}
        </h2>

        {loading ? (
          <span className="shrink-0 text-[11px] text-txt3">{t('source.searching')}</span>
        ) : error ? (
          <span className="shrink-0 text-[11px] text-danger">{t('source.failed')}</span>
        ) : items.length === 0 ? (
          <span className="shrink-0 text-[11px] text-txt3">{t('source.noResults')}</span>
        ) : null}

        <div className="flex-1" />

        {items.length > 0 ? (
          <button
            onClick={seeMore}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-txt2 transition hover:bg-raised2 hover:text-accent"
          >
            {t('source.seeMore')}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1.5 truncate text-[11px] text-danger" title={error.message}>
          {errorMessage(error)}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-3 flex gap-3">
          {Array.from({ length: PER_SOURCE }, (_, i) => (
            <div key={i} className="w-[150px] shrink-0">
              <div className="aspect-2/3 animate-pulse rounded-card bg-raised" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="mt-3 flex gap-3">
          {items.slice(0, PER_SOURCE).map((m) => (
            <div key={m.id} className="w-[150px] shrink-0">
              <CoverCard manga={m} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
