import { assetUrl } from '@/lib/gql/client'
import { contentWarningLabel } from '@/lib/format'
import { languageName } from '@/lib/intl'
import { Button, Chip } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { ExtensionsQuery, SourcesQuery } from '@/lib/gql/generated/graphql'

export type Extension = ExtensionsQuery['extensions']['nodes'][number]
export type Source = SourcesQuery['sources']['nodes'][number]

/** What install/uninstall/update all boil down to on the server. */
export type ExtensionAction = Partial<Record<'install' | 'uninstall' | 'update', boolean>>

/**
 * One row of the extension list.
 *
 * Lives in its own file because the Extensions screen is already busy with
 * filtering, tabs and the source index; the row only needs to know how to draw
 * one extension and which callbacks to fire.
 */
export function ExtensionRow({
  extension: ext,
  sources,
  expanded,
  busy,
  onOpenCatalog,
  onOpenSource,
  onRun,
}: {
  extension: Extension
  /** The sources this extension provides. Empty until the query lands. */
  sources: Source[]
  expanded: boolean
  busy: boolean
  onOpenCatalog: (pkgName: string) => void
  onOpenSource: (sourceId: string) => void
  onRun: (pkgName: string, action: ExtensionAction) => void
}): React.ReactNode {
  const t = useT()

  // Only an installed extension has a catalog. The source list can arrive a
  // moment after the extension list, so the row only becomes a button once it
  // does — better than a click that does nothing.
  const navigable = ext.isInstalled && sources.length > 0
  const many = sources.length > 1
  const warning = contentWarningLabel(ext.contentWarning)

  const identity = (
    <>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-card bg-raised2">
        {ext.iconUrl ? (
          <img
            src={assetUrl(ext.iconUrl)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-txt group-hover:text-accent" title={ext.pkgName}>
          {ext.name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-txt3">
          <span>{ext.lang}</span>
          <span>· v{ext.versionName}</span>
          {/* The invitation to open the catalog lives on the metadata line: a
              lone arrow at the far end of the row connects to nothing. */}
          {navigable ? (
            <span className="text-txt2 group-hover:text-accent">
              {many
                ? t('ext.catalogs', { n: sources.length, arrow: expanded ? '▾' : '▸' })
                : t('ext.openCatalog')}
            </span>
          ) : null}
          {ext.isObsolete ? <Chip tone="danger">{t('ext.obsolete')}</Chip> : null}
          {warning ? <Chip tone="warning">{warning}</Chip> : null}
        </p>
      </div>
    </>
  )

  return (
    <li className="px-6 py-2.5 transition hover:bg-raised/70">
      <div className="flex items-center gap-3">
        {navigable ? (
          <button
            onClick={() => onOpenCatalog(ext.pkgName)}
            className="group flex min-w-0 flex-1 items-center gap-3 text-left"
            title={many ? t('ext.chooseLanguageHint') : t('ext.openCatalogHint')}
          >
            {identity}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
        )}

        {ext.hasUpdate ? (
          <Button
            tone="primary"
            small
            onClick={() => onRun(ext.pkgName, { update: true })}
            disabled={busy}
          >
            {busy ? '…' : t('ext.update')}
          </Button>
        ) : null}

        <Button
          tone={ext.isInstalled ? 'danger' : 'neutral'}
          small
          onClick={() => onRun(ext.pkgName, ext.isInstalled ? { uninstall: true } : { install: true })}
          disabled={busy}
          className="w-24"
        >
          {busy ? '…' : ext.isInstalled ? t('ext.uninstall') : t('ext.install')}
        </Button>
      </div>

      {expanded && many ? (
        // 61 languages in MangaDex's case: its own scroll so the list does not
        // push the following extensions off screen.
        <div className="mt-3 max-h-56 overflow-y-auto pl-13">
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpenSource(s.id)}
                className="rounded-full px-2.5 py-1 text-[11px] text-txt2 ring-1 ring-inset ring-line transition hover:bg-raised2 hover:text-accent hover:ring-accent"
              >
                {languageName(s.lang)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  )
}
