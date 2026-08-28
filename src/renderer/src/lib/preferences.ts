import { useSyncExternalStore } from 'react'

/** App-wide preferences: things that belong to no single screen. */
export interface Preferences {
  /** Ask GitHub once per launch whether a newer release exists. */
  checkForUpdates: boolean
}

const DEFAULTS: Preferences = { checkForUpdates: true }
const KEY = 'kagami.preferences'

function load(): Preferences {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Preferences>
    // Field by field, and only accepting the right type: a preference written
    // by an older version, or edited by hand, must not turn into `undefined`
    // and read as "off" by accident.
    return {
      checkForUpdates:
        typeof parsed.checkForUpdates === 'boolean'
          ? parsed.checkForUpdates
          : DEFAULTS.checkForUpdates,
    }
  } catch {
    return DEFAULTS
  }
}

/**
 * A store rather than a context, because the two components that care about
 * this sit at opposite ends of the tree — the switch in the navigation rail,
 * the reader of it in a floating notice — and wrapping the whole app in a
 * provider for one boolean is more machinery than the problem deserves.
 */
let current = load()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setPreferences(patch: Partial<Preferences>): void {
  // A new object every time: useSyncExternalStore compares snapshots by
  // identity, so mutating in place would render nothing.
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    /* not persisted; the choice still holds for this session */
  }
  for (const listener of listeners) listener()
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, () => current)
}
