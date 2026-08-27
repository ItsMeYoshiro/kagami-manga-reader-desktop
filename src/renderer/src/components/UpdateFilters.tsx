import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { Button } from '@/components/ui'
import { FilterIcon } from '@/components/ui/Icons'
import { useT, type Key } from '@/lib/i18n'
import {
  SET_UPDATE_SETTINGS_MUTATION,
  UPDATE_SETTINGS_QUERY,
} from '@/lib/gql/operations/libraryUpdate'
import type { UpdateSettingsQuery } from '@/lib/gql/generated/graphql'

type SettingName = 'excludeUnreadChapters' | 'excludeNotStarted' | 'excludeCompleted'

const FILTERS: { name: SettingName; label: Key; help: Key }[] = [
  { name: 'excludeUnreadChapters', label: 'filters.unread', help: 'filters.unreadHelp' },
  { name: 'excludeNotStarted', label: 'filters.notStarted', help: 'filters.notStartedHelp' },
  { name: 'excludeCompleted', label: 'filters.completed', help: 'filters.completedHelp' },
]

/**
 * Library update filters.
 *
 * Suwayomi turns all three on by default, and the combination usually discards
 * the entire library — "Update" runs and does nothing. Making that visible here
 * is what makes the outcome explainable.
 */
export function UpdateFilters(): React.ReactNode {
  const qc = useQueryClient()
  const t = useT()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['update-settings'],
    queryFn: () => request<UpdateSettingsQuery>(UPDATE_SETTINGS_QUERY),
  })

  const save = useMutation({
    mutationFn: (patch: Partial<Record<SettingName, boolean>>) =>
      request(SET_UPDATE_SETTINGS_MUTATION, {
        excludeUnreadChapters: patch.excludeUnreadChapters ?? null,
        excludeNotStarted: patch.excludeNotStarted ?? null,
        excludeCompleted: patch.excludeCompleted ?? null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['update-settings'] }),
  })

  const settings = data?.settings
  const activeCount = settings ? FILTERS.filter((f) => settings[f.name]).length : 0

  return (
    <div className="relative">
      <Button tone="ghost" small onClick={() => setOpen((v) => !v)} title={t('filters.title')}>
        <FilterIcon />
        {activeCount > 0 ? t('filters.buttonCount', { n: activeCount }) : t('filters.button')}
      </Button>

      {open ? (
        <>
          {/* Clicking outside closes it; without this the panel would only shut
              from its own button. */}
          <button
            aria-label={t('filters.close')}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-76 rounded-panel bg-raised p-3 shadow-2xl shadow-black/60 ring-1 ring-line">
            <p className="mb-2 px-2 text-[11px] text-txt3">{t('filters.intro')}</p>
            {FILTERS.map((f) => (
              <label
                key={f.name}
                className="flex cursor-pointer items-start gap-2.5 rounded-card px-2 py-2 transition hover:bg-raised2"
              >
                <input
                  type="checkbox"
                  checked={settings?.[f.name] ?? false}
                  disabled={!settings || save.isPending}
                  onChange={(e) => save.mutate({ [f.name]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] text-txt">{t(f.label)}</span>
                  <span className="block text-[11px] leading-snug text-txt3">{t(f.help)}</span>
                </span>
              </label>
            ))}
            {activeCount === FILTERS.length ? (
              <p className="mt-2 rounded-card bg-warn/10 px-2.5 py-2 text-[11px] leading-snug text-warn">
                {t('filters.allOn')}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
