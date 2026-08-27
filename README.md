# Kagami

A manga reader for Windows, built on Mihon's extension ecosystem.

## Download

**[Get the installer](https://github.com/ItsMeYoshiro/kagami-manga-reader-desktop/releases/latest)**
— Windows 10/11, 64-bit. Nothing else to install: the JVM the sources need is
bundled inside.

The installer is **not signed**, so SmartScreen will show *"Windows protected
your PC"* the first time. Click **More info** then **Run anyway**. Signing needs
a certificate that costs a few hundred dollars a year, and no free tier exists;
until then the warning is unavoidable for any independent build.

### Checking what you downloaded

Signing is out of reach, but provenance is not. Every release is built by
[the release workflow](.github/workflows/release.yml) on GitHub's runners and
carries a signed statement of where it came from:

```bash
gh attestation verify Kagami-0.1.0-x64.exe \
  --repo ItsMeYoshiro/kagami-manga-reader-desktop
```

That answers a different question from a signature. A signature says Windows
trusts the publisher; this says the file you hold is exactly what this
repository, at a named commit, builds into — and you check it against GitHub
rather than against a promise made here.

## How it works

Mihon's extensions are Android APKs (DEX bytecode).
[Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server) converts those
APKs to JVM bytecode (dex2jar plus ASM bytecode patches) and runs them against a
compatibility layer that emulates the `android.*` APIs. That is what makes it
possible to run Mihon's own sources off Android.

Kagami is the client: an Electron UI that starts and supervises that server as a
child process and talks to it over GraphQL. The user installs an `.exe` and
never has to know there is a JVM inside.

```
Electron (main)          Electron (renderer)
├─ spawns the JVM   ◄──► ├─ React + TanStack Query
├─ health check     IPC  ├─ GraphQL / graphql-ws
└─ lifecycle             └─ <img> straight at the server
        │
        ▼ spawn
Suwayomi-Server (bundled JRE) → Mihon .apk extensions
```

## Requirements

- Node.js 20+
- The Suwayomi-Server bundle (JRE + jar), unpacked **next to** the clone

The server is a ~500 MB release artifact, so it is not in the repository. Run
this from inside the clone:

```bash
curl -L -o s.zip https://github.com/Suwayomi/Suwayomi-Server/releases/download/v2.3.2243/Suwayomi-Server-v2.3.2243-windows-x64.zip
unzip s.zip -d ../server && rm s.zip
```

You should end up with the server as a sibling of the repository:

```
your-folder/
├─ kagami/     ← this repository
└─ server/
   └─ Suwayomi-Server-v2.3.2243-windows-x64/
```

Both `npm run dev` and `npm run dist` look there. The versioned folder name
does not matter — one level of nesting is accepted.

## Development

```bash
npm install
npm run dev        # Vite + Electron with hot reload
npm run check      # types + GraphQL documents + dictionaries
```

`ServerManager` detects a server already running on port 4567 and attaches to it
instead of starting a second one. In other words: you can leave the server up in
another terminal and restart the app as often as you like.

To open straight onto a screen, without navigating the UI after every restart:

```bash
KAGAMI_ROUTE=/manga/1 npm run dev
```

### Layout

```
src/
  main/        Electron main process: spawns and supervises the JVM
  preload/     the only bridge to the renderer
  shared/      types shared by both sides
  renderer/src/
    routes/       one file per screen
    components/   shared UI, `ui/` holds the primitives
    lib/
      gql/        client, subscriptions and the GraphQL documents
      i18n/       dictionaries and the language catalog
      reader/     reader settings, preloading and progress
    platform/     the boundary that keeps `electron` out of the UI
```

### GraphQL types

The types in `src/renderer/src/lib/gql/generated/` are generated from the
server's schema. With the server up:

```bash
npm run codegen
```

They are committed on purpose — a fresh clone compiles without needing a running
server.

### Installing sources

The server starts with no sources, but the app takes care of that on its own:
`RepositoryProvider` registers the **Keiyoushi** repository on first run and
calls `fetchExtensions` right after. Just open the **Extensions** tab and
install.

To check the state from the server's side:

```bash
curl -X POST http://127.0.0.1:4567/api/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ extensionStores { nodes { name indexUrl } } extensions { totalCount } }"}'
```

## Languages

Portuguese (Brazil) and English. The switch sits at the foot of the navigation
rail, and the choice is stored in `localStorage` (`kagami.lang`). With no stored
preference the app follows the system: it matches the full code first and the
base subtag second, so `pt-PT` and `pt` land on `pt-BR`; anything that matches
nothing falls back to English.

### Adding a language

**One new file and one line.** The contributor guide lives in
[`src/renderer/src/lib/i18n/README.md`](src/renderer/src/lib/i18n/README.md).

In short: copy `en.ts`, translate it, and add an entry to `catalog.ts`. The
picker, the rail badge, the system detection and the validation of the stored
value all derive from `CATALOG`, so nothing else changes.

### What keeps it honest

`pt-BR.ts` is the source of truth for the key set, and the `Dictionary` type
requires all of them — **a forgotten translation breaks `npm run typecheck`**
rather than shipping as the wrong language.

```bash
npm run check-i18n   # dictionaries
npm run check        # types + GraphQL + dictionaries
```

`check-i18n` catches what the compiler cannot:

- **drifted placeholders.** If the base says `{n} titles` and a translation says
  `{count} titles`, it compiles — and the user sees `{count}` on screen.
- **orphan keys**, so unused text stops asking every new language for a
  translation.

```ts
t('ext.footer', { name: 'Keiyoushi' })   // {x} interpolation
tp('manga.chapters', 63)                 // _one / _other via Intl.PluralRules
```

Languages with more plural forms (`_few`, `_many`, `_zero`…) can declare them in
their own dictionary; anything missing falls back to `_other`.

### Three traps the implementation had to solve

- **A language is not only text.** Dates (`27/08` vs `08/27, 05:42 AM`), the
  source language names (`Intl.DisplayNames`) and alphabetical sorting
  (`localeCompare`) all change too. They all read `locale()` from `lib/i18n`.
- **The main process does not know the interface language** — the preference
  lives in the renderer. That is why `ServerStatus` carries `errorCode` +
  `errorDetail` instead of a finished sentence: whoever displays it translates it.
- **The provider records the current language during render**, not in an effect.
  A parent's effect runs after its children, so the first paint would come out
  in the previous language.

The reader's persisted values (`paged-rtl`, `height`…) are kept separate from
their labels: what is stored in `localStorage` must not change shape when the
language does.

## Interface

Dark Material 3, in Mihon's spirit: areas are separated by **tone** rather than
borders, and each screen has at most one filled button — the thing it exists to do.

Tokens live in `src/renderer/src/index.css`:

| Role | Choice | Why |
|---|---|---|
| Surfaces | warm, faintly violet graphite (`#0c0b0f` → `#2e2c38`) | covers already bring plenty of colour; the interface has to recede |
| Accent | 藤色 *fuji*, wisteria (`#c0aef5`) | light enough to carry dark text on top |
| Headings | Zen Kaku Gothic New | a Japanese gothic's Latin is narrower with flatter terminals: long titles fit in less space, and a Japanese title does not switch family mid-string |
| Body and data | IBM Plex Sans | humanist, holds up at 11–13px, and has real tabular figures — this screen is full of numbers |

Fonts are bundled (`@fontsource`, Latin subset, ~150 kB): the app has to open
identically with no internet, and the renderer's CSP only allows its own origin.
`font-src 'self' data:` is set in `index.html`.

Colour carries exactly one meaning, which is why the accent shows up rarely:
**there is something new here**. The rail counter, the unread pill on a cover,
an unread chapter's dot, progress — everything else is grey.

### The fore-edge

Every library cover has a 4px track on its **left** edge, filled from the bottom
with the fraction of chapters already read.

Manga is bound right to left: the spine is on the right, so the cut edge — the
one that shows on a physical volume how much has gone by — is on the left. The
track shows even at 0%, because it is what gives the fill a scale to mean
anything against.

It needs `chapters { totalCount }` in `LIBRARY_QUERY`, alongside `unreadCount`.

## Browse

**Global search**: pick a language and the term goes to every source installed
in it. Each source becomes a row — name, the first 5 results, and a "see more"
that opens that source's full catalog with infinite scrolling.

One query per source (`useQueries`), not a single one: scanlation sources go
down often, and one failure cannot wipe out the others. The error appears inside
the row, with the useful part extracted (`errorMessage` strips the "Exception
while fetching data (...)" wrapper and the Java stack, leaving things like
"HTTP error 404").

The calls go through a limiter of 6 at a time: each one makes the server go out
to the internet, and releasing 20 at once delays precisely the first responses,
which are the ones the user sees.

Language and term live in the URL (`?lang=&q=`), so stepping into a "see more"
and coming back does not discard the search. The language is also kept in
`localStorage`, and the list is ordered by source count — the server's raw order
is by code, and the first is usually a practically empty language (Afrikaans).

On a single source's screen, infinite scrolling uses `useInfiniteQuery` with an
`IntersectionObserver` sentinel 400 px before the end, deduplicating by id
(sources repeat entries across pages often).

> When testing persistence, close the app through its window. `Stop-Process
> -Force` kills Chromium before it flushes `localStorage` to disk and the
> preference is lost — it looks like a code bug and is not.

## Library updates

The **Update** button on Library fetches new chapters, with live progress
(`libraryUpdateStatusChanged`), a stop button and a last-updated stamp.

Two server traps, both handled in the UI:

- **The default filters discard the entire library.** Suwayomi ships with
  `excludeUnreadChapters`, `excludeNotStarted` and `excludeCompleted` all on;
  any title with a pending chapter is skipped, so "Update" runs and does
  nothing. The **Filters** panel exposes all three, and a warning explains when
  everything was excluded.
- **Enqueueing is asynchronous.** `updateLibrary`'s response reports
  `totalJobs: 0` even when the update will run, so the "nothing to update"
  warning is derived from the real state coming over the subscription two
  seconds after triggering — not from the mutation's answer.

## Downloads

Every chapter has a download/cancel/delete button, and the **Downloads** screen
shows the queue with live progress, pause and clear. Enqueueing already starts
the downloader.

Progress arrives over a GraphQL subscription (`graphql-ws` on
`ws://<host>/api/graphql`). The first message carries the whole queue in
`initial`; later ones carry only deltas. When `omittedUpdates` is true the server
dropped events and the state is re-read with the query — applying deltas on top
of an incomplete base would let the queue drift.

Two traps that cost real time and are settled in the code:

- **`backgroundThrottling: false`** on the BrowserWindow. Chromium throttles
  background renderers and the queue's messages were arriving every ~8 s instead
  of ~1 s. A reader with downloads running spends much of its time minimised.
- The GraphQL clients are configured **during ServerGate's render**, not in an
  effect: React runs children's effects before the parent's, so an effect there
  left the provider subscribing before a client existed.

## Extensions

The **Extensions** screen installs, updates and removes sources without leaving
the app.

The catalog holds ~1400 entries, so the list renders at most 120 at a time and
defaults to the "Installed" tab. Filtering is the expected flow, not a
workaround.

Content warning: only `NSFW` becomes a label. `MIXED` is most sources — flagging
nearly every row warns about nothing and just turns the list amber.

### The repository is the app's choice

There is no screen for registering a repository. Asking "which repository do you
want your extensions from?" hands the user a decision they have no way to make:
the answer is almost always the same, and getting it wrong means an app with no
sources at all.

`RepositoryProvider` registers Keiyoushi on its own when there is none, and the
Extensions screen merely reports the choice in its footer. Details the
implementation has to respect:

- **One attempt per session** (guarded by a `ref`). Without it, a network
  failure becomes a re-registration loop on every refetch of the list.
- **`fetchExtensions` chained on.** The server does not reconcile the catalog by
  itself: without that second call, registering the repository leaves the list
  empty.
- **The check is "is the list empty", not a URL comparison.** We register
  `.../repo/index.min.json` and the server stores `.../repo/index.pb`; comparing
  URLs would re-register forever.
- On failure the screen shows the error with a "try again" — the only point at
  which the user needs to know a repository exists.

### Opening an extension's catalog

Clicking an installed extension opens its catalog — the same infinite-scrolling
screen that Browse's "see more" uses, only with no search term, showing the
source's popular titles.

An extension and a source are not the same thing: the source is what has a
catalog, and one extension can expose several. MangaDex's exposes 61, one per
language. So the row behaves in two ways:

| Sources | Click |
|---|---|
| 1 | opens the catalog directly |
| several | expands the language list; clicking a language opens it |

The click only becomes a click once the sources query answers — until then the
row does not pretend to be a button. Languages appear by name
(`Intl.DisplayNames`), not by the uppercased code the server puts in
`displayName` ("MangaDex (AF)").

Because two doors lead to that screen, the back button has to know which one the
user came through: the origin goes in the URL (`?from=extensions`) rather than
router state, so it survives a reload — and it is preserved if they search from
in there, or back would change destination mid-navigation.

## Reader

Three modes, persisted per machine in `localStorage`:

| Mode | Behaviour |
|---|---|
| Paged ← (manga) | One page at a time, right to left. Default. |
| Paged → | One page at a time, left to right. |
| Continuous ↓ | Vertical scrolling (webtoon). |

Fit modes: width, height, original.

### Long-strip detection

The stored preference is not always the right one. Webtoons are published as
tall strips instead of pages, and fitting a strip to the window height collapses
it: a 940x2516 strip in a 1266x779 window is painted **325 px wide, at 0.35x its
own resolution**, with black bars over four fifths of the screen. The same
defaults on a page-shaped scan are fine (0.72x, filling 35% of the width).

So the reader measures the first pages of a chapter and, above a 2:1 ratio,
reads it as continuous fitted to width — 1.25x, filling 74%. A page-shaped scan
sits near 1.4:1 and rarely passes 1.6:1, and a double-page spread is *wider*
than tall, so it cannot trip the check.

The guess never overwrites what is in `localStorage`, and it steps aside the
moment the reader touches either control, for as long as that title is open.
Opening a different title lets it decide again.

The width fit adds a third control, **maximum width**: never upscale (default),
800/1000/1200/1400 px, or full width. Manhwa is published at a fixed width
(TBATE, for instance, ships at 940 px); stretching past that only blurs the art.
The "never upscale" default uses `max-width: max-content`, which resolves to the
image's intrinsic width without having to know it up front.

Continuous mode finds the current page with a line at the centre of the viewport
(`rootMargin: -50% 0px -50% 0px`) rather than an intersection ratio. A manhwa
page is ~3000 px tall; in a ~700 px viewport the highest possible ratio is ~0.22,
so any threshold above that never fires and the index freezes — taking reading
progress with it.

Shortcuts: arrows and space turn the page (following the mode's direction),
`Esc` goes back to the title's screen. In paged mode, clicking either half of
the screen also navigates.

The keyboard handler ignores events whose target is a `SELECT`, `INPUT` or
`TEXTAREA`. Without that, pressing an arrow with a toolbar control focused
changed the preference *and* turned the page at the same time — the user
switched reading mode without noticing.

Progress is written with an 800 ms debounce and always flushed when leaving the
reader, so closing mid-chapter does not lose the page. It never un-reads a
chapter: `isRead: false` would clear the flag on a finished chapter just because
it was opened for a glance, so only `true` or `null` is ever sent.

Neighbouring pages (3 ahead, 1 behind) are preloaded with `new Image()`. The
images are not retained in memory: the point is only to warm Chromium's cache so
the page turn is instant.

## Packaging

```bash
npm run dist       # builds dist/Kagami-<version>-x64.exe (NSIS)
```

`electron-builder.yml` copies all of `../server` into `resources/server`, minus
the Electron build and the launchers the bundle ships that we do not use.

The installer is **not signed**. Windows SmartScreen will warn about it, and
browsers will flag the download — see [Download](#download) for what to tell
people about that.

### Releasing

`.github/workflows/release.yml` runs the same `npm run dist` on a Windows
runner, fetching the server bundle the way the requirements above describe, and
records a provenance attestation for the installer before attaching it to the
release. Trigger it by pushing a `v*` tag, or from the Actions tab against an
existing tag.

Two things that are easy to get wrong there, both already handled: the `tar` on
PATH in Git Bash is GNU tar and cannot read a zip (Windows ships bsdtar as
`tar.exe`, which can), and electron-builder starts publishing on its own the
moment it detects CI unless it is passed `--publish never`.

### Icon

`build/icon.ico` feeds the .exe, the installer, the shortcut and the
Add/Remove Programs entry. It is committed; to regenerate it:

```bash
python scripts-icon.py     # needs Pillow
```

It is the app's 鏡, inverted: in the navigation rail the glyph is light on
graphite, in the icon it is dark on wisteria. The app is named "mirror".

Each size in the `.ico` is **drawn on its own**, not scaled down from one
master. A kanji has far too many strokes to survive a single reduction: from
48px down, the glyph takes up more of the tile and the stroke is thickened
(`stroke_width`), or it fades into a grey smudge. At 16px it is still a smudge —
that is the fate of any CJK mark at that size — but a dark, structured smudge on
wisteria, which is what you actually recognise in the taskbar.

## Portability

The renderer never imports `electron`. Everything shell-specific goes through
`src/renderer/src/platform/`. Swapping Electron for Tauri (or running as a PWA)
means rewriting only that one file.

## Licences

Kagami is MPL-2.0; the full text is in [LICENSE](LICENSE). Mihon is Apache-2.0
and Suwayomi-Server is MPL-2.0 — both independent projects, merely consumed
here. "Mihon" and its logo belong to the Mihon project and are not used in this
app.
