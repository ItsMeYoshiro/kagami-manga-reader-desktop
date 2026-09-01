# Kagami

A manga reader for Windows, built on Mihon's extension ecosystem.

Mihon's extensions are Android APKs (DEX bytecode).
[Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server) converts them to
JVM bytecode and runs them against a layer that emulates the `android.*` APIs,
which is what makes Mihon's own sources work off Android. Kagami is the client:
an Electron UI that starts and supervises that server and talks to it over
GraphQL. You install one `.exe` and never have to know there is a JVM inside.

## Download

**[Get the installer](https://github.com/ItsMeYoshiro/kagami-manga-reader-desktop/releases/latest)**
— Windows 10/11, 64-bit. Nothing else to install.
Screenshots and the short version are on the
[project page](https://itsmeyoshiro.github.io/kagami-manga-reader-desktop/).

The installer is **not signed**, so SmartScreen will show *"Windows protected
your PC"* the first time. Click **More info** then **Run anyway**. Signing needs
a certificate that costs a few hundred dollars a year, and no free tier exists;
until then the warning is unavoidable for any independent build.

What *is* within reach is provenance. Every release is built by
[the release workflow](.github/workflows/release.yml) on GitHub's runners and
carries a signed statement of where it came from:

```bash
gh attestation verify Kagami-0.1.3-x64.exe \
  --repo ItsMeYoshiro/kagami-manga-reader-desktop
```

A signature would say Windows trusts the publisher. This says something
narrower and checkable: the file you hold is exactly what this repository, at a
named commit, builds into.

## Running it locally

You need **Node.js 20+** and the Suwayomi-Server bundle. The bundle is a
~500 MB release artifact, so it is not in the repository — download it next to
the clone:

```bash
git clone https://github.com/ItsMeYoshiro/kagami-manga-reader-desktop.git
cd kagami-manga-reader-desktop

curl -L -o s.zip https://github.com/Suwayomi/Suwayomi-Server/releases/download/v2.3.2243/Suwayomi-Server-v2.3.2243-windows-x64.zip
unzip s.zip -d ../server && rm s.zip

npm install
npm run dev
```

The server has to end up as a **sibling of the repository** — that is where both
the app and the packaging step look for it:

```
your-folder/
├─ kagami-manga-reader-desktop/   ← this repository
└─ server/
   └─ Suwayomi-Server-v2.3.2243-windows-x64/
```

The versioned folder name does not matter; one level of nesting is accepted.

The server starts with no sources, but the app handles that: it registers the
**Keiyoushi** repository on first run, so you only have to open the
**Extensions** tab and install what you want.

## Working on it

```bash
npm run dev        # Vite + Electron with hot reload
npm run check      # types + GraphQL documents + dictionaries
npm run codegen    # regenerate GraphQL types (needs the server up)
npm run dist       # build dist/Kagami-<version>-x64.exe
```

`ServerManager` attaches to a server already running on port 4567 instead of
starting a second one, so you can leave it up in another terminal and restart
the app freely. To open straight onto a screen:

```bash
KAGAMI_ROUTE=/manga/1 npm run dev
```

When testing anything that persists, close the app through its window. A
`Stop-Process -Force` kills Chromium before it flushes `localStorage` to disk,
and the preference you just set is gone — which reads exactly like a bug in the
code that saved it.

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

The generated GraphQL types in `lib/gql/generated/` are committed on purpose, so
a fresh clone compiles without a running server.

### Adding a language

**One new file and one line** — copy `en.ts`, translate it, and register it in
`catalog.ts`. A missing key breaks `npm run typecheck` rather than shipping as
the wrong language. Full guide:
[`src/renderer/src/lib/i18n/README.md`](src/renderer/src/lib/i18n/README.md).

### Releasing

`.github/workflows/release.yml` runs the same `npm run dist` on a Windows
runner, attests the installer and attaches it to the release. Trigger it by
pushing a `v*` tag, or from the Actions tab against an existing tag.

## Licences

Kagami is MPL-2.0; the full text is in [LICENSE](LICENSE). Mihon is Apache-2.0
and Suwayomi-Server is MPL-2.0 — both independent projects, merely consumed
here. "Mihon" and its logo belong to the Mihon project and are not used in this
app.
