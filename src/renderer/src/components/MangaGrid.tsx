import { useNavigate } from 'react-router-dom'
import { assetUrl } from '@/lib/gql/client'
import { EmptyState } from '@/components/ui'
import { useT } from '@/lib/i18n'

/**
 * The least a card needs. The extra fields are optional because the same grid
 * serves the library (which knows about progress) and search results (which
 * only know id, title and cover).
 */
export type MangaCard = {
  id: number
  title: string
  thumbnailUrl?: string | null
  inLibrary?: boolean
  unreadCount?: number
  downloadCount?: number
  chapters?: { totalCount: number }
}

export function MangaGrid({ items }: { items: MangaCard[] }): React.ReactNode {
  const t = useT()
  if (items.length === 0) {
    return <EmptyState title={t('grid.empty')} />
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(164px,1fr))] gap-3.5 p-6">
      {items.map((m) => (
        <CoverCard key={m.id} manga={m} />
      ))}
    </div>
  )
}

export function CoverCard({ manga: m }: { manga: MangaCard }): React.ReactNode {
  const navigate = useNavigate()
  const t = useT()

  const total = m.chapters?.totalCount ?? 0
  const unread = m.unreadCount ?? 0
  const read = total - unread
  const progress = total > 0 && read > 0 ? read / total : 0

  return (
    <button
      onClick={() => navigate(`/manga/${m.id}`)}
      className="group block w-full text-left"
      title={m.title}
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-card bg-raised ring-1 ring-white/8 transition duration-200 group-hover:-translate-y-0.5 group-hover:ring-accent group-focus-visible:ring-accent">
        {m.thumbnailUrl ? (
          <img
            src={assetUrl(m.thumbnailUrl)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : null}

        {/* Darkens the foot of the cover just enough for the title to stay
            legible over any artwork, without becoming a solid band. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/92 via-black/50 to-transparent" />

        {total > 0 ? (
          /* The fore-edge. Manga is bound right to left, so the spine is on the
             right and the cut edge — the one that shows how much of a physical
             volume has gone by — is on the left.
             The track shows even at 0%, because it is what gives the fill a
             scale to mean anything against. */
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-black/60"
            title={t('grid.progress', { read, total })}
          >
            <div
              className="absolute inset-x-0 bottom-0 bg-accent"
              style={{ height: `${Math.min(100, Math.max(0, progress) * 100)}%` }}
            />
          </div>
        ) : null}

        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {unread > 0 ? (
            <span className="tnum rounded-full bg-accent px-1.5 py-px text-[11px] leading-4 font-semibold text-accent-ink">
              {unread}
            </span>
          ) : null}
          {m.downloadCount ? (
            <span className="tnum rounded-full bg-black/70 px-1.5 py-px text-[11px] leading-4 font-medium text-txt">
              ↓{m.downloadCount}
            </span>
          ) : null}
          {m.inLibrary ? (
            <span className="rounded-full bg-accent/90 px-1.5 py-px text-[10px] leading-4 font-medium text-accent-ink">
              {t('grid.inLibrary')}
            </span>
          ) : null}
        </div>

        <p
          className="absolute inset-x-2.5 bottom-2 line-clamp-2 font-display text-[12.5px] leading-tight font-medium text-white"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,.85)' }}
        >
          {m.title}
        </p>
      </div>
    </button>
  )
}
