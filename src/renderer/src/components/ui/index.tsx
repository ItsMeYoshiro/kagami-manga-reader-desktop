import type { ReactNode } from 'react'

/**
 * Shared controls.
 *
 * Without these, every screen reinvented the same button class with a slightly
 * different radius or padding — and the whole interface looked like it had been
 * assembled by different people.
 */

type Tone = 'primary' | 'neutral' | 'danger' | 'ghost'

const TONE: Record<Tone, string> = {
  // One filled button per screen: the action that screen exists to perform.
  primary: 'bg-accent text-accent-ink hover:brightness-110',
  neutral: 'bg-raised2 text-txt hover:bg-line',
  danger: 'bg-transparent text-txt2 ring-1 ring-inset ring-line hover:text-danger hover:ring-danger/60',
  ghost: 'bg-transparent text-txt2 ring-1 ring-inset ring-line hover:text-txt hover:bg-raised2',
}

export function Button({
  tone = 'ghost',
  small = false,
  className = '',
  children,
  ...rest
}: {
  tone?: Tone
  small?: boolean
  children: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>): React.ReactNode {
  return (
    <button
      {...rest}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium transition disabled:pointer-events-none disabled:opacity-40 ${
        small ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-[13px]'
      } ${TONE[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

/** Icon-only button, square, with a comfortable hit area. */
export function IconButton({
  label,
  className = '',
  children,
  ...rest
}: { label: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>): React.ReactNode {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-full text-txt2 transition hover:bg-raised2 hover:text-txt disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

type ChipTone = 'neutral' | 'accent' | 'warning' | 'danger'

const CHIP_TONE: Record<ChipTone, string> = {
  neutral: 'bg-raised2 text-txt2',
  accent: 'bg-accent text-accent-ink',
  warning: 'bg-warn/15 text-warn',
  danger: 'bg-danger/15 text-danger',
}

export function Chip({
  tone = 'neutral',
  className = '',
  children,
  ...rest
}: { tone?: ChipTone; children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>): React.ReactNode {
  return (
    <span
      {...rest}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-5 font-medium ${CHIP_TONE[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/** A clickable filter chip, in the Material 3 shape. */
export function FilterChip({
  active,
  className = '',
  children,
  ...rest
}: { active: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>): React.ReactNode {
  return (
    <button
      {...rest}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-accent text-accent-ink'
          : 'text-txt2 ring-1 ring-inset ring-line hover:bg-raised2 hover:text-txt'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** A screen's top bar. Separated from the content by tone, not by a border. */
export function TopBar({ children }: { children: ReactNode }): React.ReactNode {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-3 bg-surface px-6 py-3.5">
      {children}
    </header>
  )
}

export function ScreenTitle({ children }: { children: ReactNode }): React.ReactNode {
  return <h1 className="font-display text-lg leading-tight text-txt">{children}</h1>
}

export function SearchField({
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>): React.ReactNode {
  return (
    <input
      {...rest}
      className={`min-w-0 rounded-full bg-raised px-4 py-2 text-[13px] text-txt outline-none ring-1 ring-inset ring-transparent transition placeholder:text-txt3 focus:bg-raised2 focus:ring-accent/60 ${className}`}
    />
  )
}

export function Select({
  className = '',
  children,
  ...rest
}: { children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>): React.ReactNode {
  return (
    <select
      {...rest}
      className={`shrink-0 rounded-full bg-raised px-3.5 py-2 text-[13px] text-txt outline-none ring-1 ring-inset ring-transparent transition hover:bg-raised2 focus:ring-accent/60 ${className}`}
    >
      {children}
    </select>
  )
}

/** An empty screen as an invitation, not a notice: say what to do next. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}): React.ReactNode {
  return (
    <div className="grid h-full place-items-center px-8 py-16 text-center">
      <div className="max-w-sm">
        <p className="font-display text-base text-txt">{title}</p>
        {body ? <p className="mt-1.5 text-[13px] leading-relaxed text-txt3">{body}</p> : null}
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }): React.ReactNode {
  return (
    <p className="mx-6 my-4 rounded-card bg-danger/10 px-4 py-3 text-[13px] leading-relaxed text-danger">
      {children}
    </p>
  )
}
