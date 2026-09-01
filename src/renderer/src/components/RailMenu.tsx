import { useState, type ReactNode } from 'react'
import { useT } from '@/lib/i18n'

/**
 * A flyout anchored to a button at the foot of the navigation rail.
 *
 * Both of the rail's menus are the same object: a round icon chip that lights
 * up while open, a panel that flies out to the right, and a full-screen button
 * behind it so that clicking anywhere else closes the menu -- without that last
 * one the menu could only be shut from its own button. Only the width of the
 * panel and what goes inside it differ, which is what the props are.
 */
export function RailMenu({
  icon,
  label,
  caption,
  panelClass,
  children,
}: {
  icon: ReactNode
  /** The trigger's tooltip, and what a screen reader announces. */
  label: string
  /** Optional line under the icon, like the language picker's code. */
  caption?: ReactNode
  /** Width, and any scrolling, of the flyout. */
  panelClass: string
  /** Handed `close`, so an item that should dismiss the menu can. */
  children: (close: () => void) => ReactNode
}): React.ReactNode {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        className="group flex flex-col items-center gap-1 py-1.5"
      >
        <span
          className={`grid h-8 w-14 place-items-center rounded-full transition ${
            open ? 'bg-raised2 text-txt' : 'text-txt2 group-hover:bg-raised2 group-hover:text-txt'
          }`}
        >
          {icon}
        </span>
        {caption ? (
          <span className="text-[11px] leading-4 text-txt3 group-hover:text-txt2">{caption}</span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            aria-label={t('filters.close')}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className={`absolute bottom-1 left-full z-50 ml-2 rounded-panel bg-raised p-1.5 shadow-2xl shadow-black/60 ring-1 ring-line ${panelClass}`}
          >
            {children(() => setOpen(false))}
          </div>
        </>
      ) : null}
    </div>
  )
}
