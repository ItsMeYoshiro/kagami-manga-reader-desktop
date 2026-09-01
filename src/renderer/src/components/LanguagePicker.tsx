import { LANGUAGES, useLanguage } from '@/lib/i18n'
import { LanguageIcon } from '@/components/ui/Icons'
import { RailMenu } from '@/components/RailMenu'

/**
 * Switches the interface language, at the foot of the navigation rail.
 *
 * It sits with the navigation because it is an app-wide preference rather than
 * a screen's -- and the app does not have, nor need, a settings screen just for
 * this one thing.
 */
export function LanguagePicker(): React.ReactNode {
  const { language, setLanguage, t } = useLanguage()

  return (
    <RailMenu
      icon={<LanguageIcon />}
      label={t('nav.language')}
      // The code itself, uppercased: a new language in the catalog shows up
      // here without needing any further change.
      caption={language.toUpperCase()}
      // Its own scroll, for the day the catalog holds more languages than fit
      // in the window's height.
      panelClass="max-h-[70vh] w-52 overflow-y-auto"
    >
      {(close) =>
        LANGUAGES.map((l) => (
          <button
            key={l.code}
            role="menuitemradio"
            aria-checked={l.code === language}
            onClick={() => {
              setLanguage(l.code)
              close()
            }}
            className={`flex w-full items-center gap-2 rounded-card px-3 py-2 text-left text-[13px] transition ${
              l.code === language
                ? 'bg-accent/15 text-accent'
                : 'text-txt2 hover:bg-raised2 hover:text-txt'
            }`}
          >
            <span className="w-3 shrink-0">{l.code === language ? '✓' : ''}</span>
            {l.name}
          </button>
        ))
      }
    </RailMenu>
  )
}
