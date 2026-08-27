import { useState } from 'react'
import { LANGUAGES, useLanguage } from '@/lib/i18n'
import { LanguageIcon } from '@/components/ui/Icons'

/**
 * Switches the interface language, at the foot of the navigation rail.
 *
 * It sits with the navigation because it is an app-wide preference rather than
 * a screen's — and the app does not have, nor need, a settings screen just for
 * this one thing.
 */
export function LanguagePicker(): React.ReactNode {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative mt-auto flex flex-col items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t('nav.language')}
        className="group flex flex-col items-center gap-1 py-1.5"
      >
        <span
          className={`grid h-8 w-14 place-items-center rounded-full transition ${
            open ? 'bg-raised2 text-txt' : 'text-txt2 group-hover:bg-raised2 group-hover:text-txt'
          }`}
        >
          <LanguageIcon />
        </span>
        {/* The code itself, uppercased: a new language in the catalog shows up
            here without needing any further change. */}
        <span className="text-[11px] leading-4 text-txt3 group-hover:text-txt2">
          {language.toUpperCase()}
        </span>
      </button>

      {open ? (
        <>
          {/* Clicking outside closes it; without this the menu would only shut
              from its own button. */}
          <button
            aria-label={t('filters.close')}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            // Its own scroll, for the day the catalog holds more languages than
            // fit in the window's height.
            className="absolute bottom-1 left-full z-50 ml-2 max-h-[70vh] w-52 overflow-y-auto rounded-panel bg-raised p-1.5 shadow-2xl shadow-black/60 ring-1 ring-line"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                role="menuitemradio"
                aria-checked={l.code === language}
                onClick={() => {
                  setLanguage(l.code)
                  setOpen(false)
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
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
