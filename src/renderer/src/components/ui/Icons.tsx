/**
 * Hand-drawn icons rather than a library: there are only a dozen, and one
 * consistent family (24px, 1.75 stroke, round caps) is worth more here than
 * several hundred symbols we will never use.
 */
type Props = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** A volume with a bookmark — the object a library keeps. */
export function LibraryIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="24" height="24" aria-hidden="true">
      <rect x="4" y="3.4" width="16" height="17.2" rx="2.4" />
      <path d="M9.2 3.4v7.8l2.8-2 2.8 2V3.4" />
    </svg>
  )
}

/** A compass: browsing is going out to look, not filtering what you have. */
export function BrowseIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" />
      <path d="M15.4 8.6l-2.1 4.7 -4.7 2.1 2.1-4.7z" />
    </svg>
  )
}

export function DownloadIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="24" height="24" aria-hidden="true">
      <path d="M12 3.5v11" />
      <path d="M7.8 10.3L12 14.5l4.2-4.2" />
      <path d="M4 16.5v2.2A1.8 1.8 0 005.8 20.5h12.4a1.8 1.8 0 001.8-1.8v-2.2" />
    </svg>
  )
}

/** A jigsaw piece: an extension slots into something that already exists. */
export function ExtensionIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="24" height="24" aria-hidden="true">
      <path d="M9.2 4.2a2.1 2.1 0 014.2 0V5.4h3.1a1.4 1.4 0 011.4 1.4v3.1h1.2a2.1 2.1 0 010 4.2h-1.2v3.1a1.4 1.4 0 01-1.4 1.4h-3.1v-1.2a2.1 2.1 0 00-4.2 0v1.2H6.1a1.4 1.4 0 01-1.4-1.4v-3.1H3.5a2.1 2.1 0 010-4.2h1.2V6.8a1.4 1.4 0 011.4-1.4h3.1z" />
    </svg>
  )
}

/** A globe with meridians — the interface language. */
export function LanguageIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.4c2.2 2.3 3.4 5.4 3.4 8.6s-1.2 6.3-3.4 8.6c-2.2-2.3-3.4-5.4-3.4-8.6S9.8 5.7 12 3.4z" />
    </svg>
  )
}

export function BackIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="20" height="20" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function SearchIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="18" height="18" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4L20 20" />
    </svg>
  )
}

export function RefreshIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="18" height="18" aria-hidden="true">
      <path d="M20 12a8 8 0 11-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </svg>
  )
}

export function BookmarkIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="18" height="18" aria-hidden="true">
      <path d="M7 4h10a1 1 0 011 1v15l-6-3.6L6 20V5a1 1 0 011-1z" />
    </svg>
  )
}

export function CheckIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="18" height="18" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function TrashIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="18" height="18" aria-hidden="true">
      <path d="M4 6.5h16" />
      <path d="M9.5 6.5V4.8A1.3 1.3 0 0110.8 3.5h2.4a1.3 1.3 0 011.3 1.3v1.7" />
      <path d="M6.2 6.5l.8 12.2A1.4 1.4 0 008.4 20h7.2a1.4 1.4 0 001.4-1.3l.8-12.2" />
    </svg>
  )
}

export function CloseIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="18" height="18" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function FilterIcon({ className }: Props): React.ReactNode {
  return (
    <svg {...base} className={className} width="18" height="18" aria-hidden="true">
      <path d="M4 6.5h16M7 12h10M10 17.5h4" />
    </svg>
  )
}
