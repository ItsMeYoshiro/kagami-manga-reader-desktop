import { setPreferences, usePreferences } from '@/lib/preferences'
import { SettingsIcon } from '@/components/ui/Icons'
import { RailMenu } from '@/components/RailMenu'
import { useT } from '@/lib/i18n'

/**
 * App-wide preferences, at the foot of the navigation rail beside the language
 * picker.
 *
 * A screen of its own would be a lot of scaffolding for a short list. It sits
 * next to the language switch because both are the same kind of thing: a choice
 * about the app rather than about whatever screen is open.
 */
export function SettingsMenu(): React.ReactNode {
  const t = useT()
  const prefs = usePreferences()

  return (
    <RailMenu icon={<SettingsIcon />} label={t('nav.settings')} panelClass="w-72">
      {/* Ticking a checkbox should leave the menu open, so `close` goes unused
          here -- you may well want to change a second thing. */}
      {() => (
        <button
          role="menuitemcheckbox"
          aria-checked={prefs.checkForUpdates}
          onClick={() => setPreferences({ checkForUpdates: !prefs.checkForUpdates })}
          className="flex w-full items-start gap-3 rounded-card px-3 py-2.5 text-left transition hover:bg-raised2"
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] text-[10px] leading-none transition ${
              prefs.checkForUpdates ? 'bg-accent text-accent-ink' : 'ring-1 ring-line ring-inset'
            }`}
          >
            {prefs.checkForUpdates ? '✓' : ''}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-txt">{t('settings.checkUpdates')}</span>
            {/* Says exactly what the request is, so turning it off is an
                informed choice rather than a guess. */}
            <span className="mt-0.5 block text-[11px] leading-relaxed text-txt3">
              {t('settings.checkUpdatesHint')}
            </span>
          </span>
        </button>
      )}
    </RailMenu>
  )
}
