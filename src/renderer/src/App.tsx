import { HashRouter, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ServerGate } from '@/components/ServerGate'
import { Library } from '@/routes/Library'
import { Browse } from '@/routes/Browse'
import { BrowseSource } from '@/routes/BrowseSource'
import { MangaDetail } from '@/routes/MangaDetail'
import { Reader } from '@/routes/Reader'
import { Extensions } from '@/routes/Extensions'
import { Downloads } from '@/routes/Downloads'
import { DownloadsProvider, useDownloads } from '@/lib/downloads/DownloadsProvider'
import { LibraryUpdateProvider } from '@/lib/library/LibraryUpdateProvider'
import { RepositoryProvider } from '@/lib/extensions/RepositoryProvider'
import { LanguageProvider, useT, type Key } from '@/lib/i18n'
import { LanguagePicker } from '@/components/LanguagePicker'
import { SettingsMenu } from '@/components/SettingsMenu'
import { UpdateNotice } from '@/components/UpdateNotice'
import { request } from '@/lib/gql/client'
import { LIBRARY_QUERY } from '@/lib/gql/operations/library'
import type { LibraryQuery } from '@/lib/gql/generated/graphql'
import { BrowseIcon, DownloadIcon, ExtensionIcon, LibraryIcon } from '@/components/ui/Icons'

type Destination = {
  to: string
  label: Key
  Icon: (p: { className?: string }) => React.ReactNode
}

const DESTINATIONS: Destination[] = [
  { to: '/library', label: 'nav.library', Icon: LibraryIcon },
  { to: '/browse', label: 'nav.browse', Icon: BrowseIcon },
  { to: '/downloads', label: 'nav.downloads', Icon: DownloadIcon },
  { to: '/extensions', label: 'nav.extensions', Icon: ExtensionIcon },
]

/** The rail's counter. Past 99 the exact number stops mattering. */
function Badge({ n }: { n: number }): React.ReactNode {
  if (n <= 0) return null
  return (
    <span className="tnum absolute -top-0.5 right-1 min-w-[18px] rounded-full bg-accent px-1 text-center text-[10px] leading-[18px] font-semibold text-accent-ink ring-2 ring-surface">
      {n > 99 ? '99+' : n}
    </span>
  )
}

function RailItem({ destination, badge }: { destination: Destination; badge: number }): React.ReactNode {
  const t = useT()
  const { Icon } = destination
  return (
    <NavLink to={destination.to} className="group flex flex-col items-center gap-1 py-1.5">
      {({ isActive }) => (
        <>
          {/* The pill behind the icon is Material 3's active-section indicator —
              quieter than painting the whole row. */}
          <span
            className={`relative grid h-8 w-14 place-items-center rounded-full transition ${
              isActive
                ? 'bg-accent/20 text-accent'
                : 'text-txt2 group-hover:bg-raised2 group-hover:text-txt'
            }`}
          >
            <Icon />
            <Badge n={badge} />
          </span>
          <span
            className={`text-[11px] leading-4 transition ${
              isActive ? 'font-medium text-txt' : 'text-txt3 group-hover:text-txt2'
            }`}
          >
            {t(destination.label)}
          </span>
        </>
      )}
    </NavLink>
  )
}

/** Layout with the navigation rail. The reader lives outside it, full screen. */
function Shell(): React.ReactNode {
  const { queue } = useDownloads()

  // Same key the Library screen uses: the rail's counter reuses the cache
  // instead of opening a second request.
  const library = useQuery({
    queryKey: ['library'],
    queryFn: () => request<LibraryQuery>(LIBRARY_QUERY),
  })
  const unread = (library.data?.mangas.nodes ?? []).reduce((sum, m) => sum + m.unreadCount, 0)

  const badgeFor = (to: string): number => {
    if (to === '/library') return unread
    if (to === '/downloads') return queue.length
    return 0
  }

  return (
    <div className="flex h-full bg-bg">
      <nav className="flex w-[88px] shrink-0 flex-col gap-1 bg-surface py-4">
        <div className="mb-3 flex flex-col items-center gap-1">
          <span
            className="grid h-11 w-11 place-items-center rounded-panel bg-accent/15 font-display text-2xl leading-none text-accent"
            aria-hidden="true"
          >
            鏡
          </span>
          <span className="text-[10px] tracking-[0.18em] text-txt3 uppercase">Kagami</span>
        </div>

        {DESTINATIONS.map((d) => (
          <RailItem key={d.to} destination={d} badge={badgeFor(d.to)} />
        ))}

        {/* One group at the foot of the rail: choices about the app, as
            opposed to the destinations above them. */}
        <div className="mt-auto flex flex-col items-center">
          <SettingsMenu />
          <LanguagePicker />
        </div>
      </nav>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      {/* Floats over whatever screen is open; it has nothing to do with the
          route, and a reader mid-chapter should not be interrupted by a layout
          shift. */}
      <UpdateNotice />
    </div>
  )
}

export default function App(): React.ReactNode {
  return (
    // The language wraps everything, ServerGate included: the startup screen
    // and the server error screen need translating too.
    <LanguageProvider>
      <ServerGate>
        {/* The download subscription lives above the router: progress keeps
            arriving while the user moves between screens. */}
        <DownloadsProvider>
          <LibraryUpdateProvider>
            <RepositoryProvider>
              {/* HashRouter: the renderer is loaded from file:// when packaged. */}
              <HashRouter>
                <Routes>
                  <Route path="/manga/:mangaId/chapter/:chapterId" element={<Reader />} />
                  <Route element={<Shell />}>
                    <Route path="/library" element={<Library />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/browse/:sourceId" element={<BrowseSource />} />
                    <Route path="/manga/:id" element={<MangaDetail />} />
                    <Route path="/downloads" element={<Downloads />} />
                    <Route path="/extensions" element={<Extensions />} />
                    <Route path="*" element={<Navigate to="/library" replace />} />
                  </Route>
                </Routes>
              </HashRouter>
            </RepositoryProvider>
          </LibraryUpdateProvider>
        </DownloadsProvider>
      </ServerGate>
    </LanguageProvider>
  )
}
