import type { Dictionary } from './types'

/**
 * English.
 *
 * `Dictionary` requires every key of the base dictionary: a forgotten
 * translation breaks `npm run typecheck` instead of showing up as the wrong
 * language in production.
 */
export const en: Dictionary = {
  // --- navigation ----------------------------------------------------------
  'nav.library': 'Library',
  'nav.browse': 'Browse',
  'nav.downloads': 'Downloads',
  'nav.extensions': 'Extensions',
  'nav.language': 'Language',

  // --- startup -------------------------------------------------------------
  'gate.loading': 'Getting your library ready…',
  'gate.retry': 'Try again',
  'gate.error.bundle':
    'Suwayomi-Server bundle not found. Expected in resources/server/ (packaged) or ../server/ (development).',
  'gate.error.jvm': 'Could not start the JVM: {detail}',
  'gate.error.exit': 'The server stopped unexpectedly ({detail}).',
  'gate.error.timeout': 'The server did not respond within {detail}s.',
  'gate.error.unknown': 'Could not start the server.',

  // --- library -------------------------------------------------------------
  'library.title': 'Library',
  'library.count_one': '{n} title',
  'library.count_other': '{n} titles',
  'library.unread_one': '{n} unread',
  'library.unread_other': '{n} unread',
  'library.skipped': '· {n} skipped',
  'library.stop': 'Stop',
  'library.updatedAt': 'Updated {date}',
  'library.neverUpdated': 'Never updated',
  'library.offline': 'No live connection',
  'library.update': 'Update',
  'library.starting': 'Starting…',
  'library.loading': 'Loading library…',
  'library.empty.title': 'Your library is empty',
  'library.empty.body':
    'Find a title in Browse and add it here to keep track of new chapters.',
  'library.empty.action': 'Go to Browse',
  'library.nothingUpdated.excluded_one':
    'Nothing was updated: the filters excluded {n} title. Adjust them under Filters.',
  'library.nothingUpdated.excluded_other':
    'Nothing was updated: the filters excluded {n} titles. Adjust them under Filters.',
  'library.nothingUpdated.none':
    'Nothing was updated: no title matched the filters. Adjust them under Filters.',

  // --- cover grid ----------------------------------------------------------
  'grid.empty': 'Nothing here yet.',
  'grid.progress': '{read} of {total} chapters read',
  'grid.inLibrary': 'in library',

  // --- browse --------------------------------------------------------------
  'browse.title': 'Browse',
  'browse.placeholder': 'Search every source in this language… (empty = popular)',
  'browse.search': 'Search',
  'browse.progress': '{done}/{total} sources',
  'browse.results': '{withResults} of {total} with results',
  'browse.loadingSources': 'Loading sources…',
  'browse.noSources.title': 'No sources installed',
  'browse.noSources.body':
    'Sources come from extensions. Install one to start looking for titles.',
  'browse.noSources.action': 'View extensions',

  // --- one source's row ----------------------------------------------------
  'source.searching': 'searching…',
  'source.failed': 'failed',
  'source.noResults': 'no results',
  'source.seeMore': 'See more →',

  // --- one source's catalog ------------------------------------------------
  'catalog.backToExtensions': 'Back to Extensions',
  'catalog.backToSearch': 'Back to global search',
  'catalog.source': 'Source',
  'catalog.placeholder': 'Search this source… (empty = popular)',
  'catalog.loading': 'Loading…',
  'catalog.empty.title': 'No results in this source',
  'catalog.empty.searched': 'Try another term, or clear the field to see popular titles.',
  'catalog.empty.popular': 'The source returned nothing. It may be down.',
  'catalog.loadingMore': 'Loading more…',
  'catalog.end': 'End of results.',

  // --- manga detail --------------------------------------------------------
  'manga.back': 'Back',
  'manga.loading': 'Loading…',
  'manga.notFound': 'Title not found.',
  'manga.unknownAuthor': 'Unknown author',
  'manga.read': 'read',
  'manga.downloaded': '{n} downloaded',
  'manga.continue': 'Continue',
  'manga.start': 'Start reading',
  'manga.inLibrary': 'In library',
  'manga.addToLibrary': 'Add to library',
  'manga.more': 'More',
  'manga.less': 'Less',
  'manga.chapters_one': '{n} chapter',
  'manga.chapters_other': '{n} chapters',
  'manga.fetching': 'Fetching from source…',

  // --- chapter list --------------------------------------------------------
  'chapters.empty': 'No chapters found.',
  'chapters.label': 'Ch. {n}',
  'chapters.page': '· p. {n}',
  'chapters.pageOf': '· p. {n}/{total}',
  'chapters.downloaded': 'downloaded',
  'chapters.cancelDownload': 'Cancel download',
  'chapters.deleteDownload': 'Delete download',
  'chapters.download': 'Download chapter',
  'chapters.markRead': 'Mark as read',
  'chapters.markUnread': 'Mark as unread',

  // --- downloads -----------------------------------------------------------
  'downloads.title': 'Downloads',
  'downloads.queued_one': '{n} queued',
  'downloads.queued_other': '{n} queued',
  'downloads.reconnecting': 'reconnecting…',
  'downloads.reconnectingHint': 'No live connection; progress may be out of date',
  'downloads.pause': 'Pause',
  'downloads.start': 'Start',
  'downloads.clear': 'Clear queue',
  'downloads.remove': 'Remove from queue',
  'downloads.empty.title': 'The queue is empty',
  'downloads.empty.body': "Download chapters from a title's page to read them offline.",
  'downloads.empty.action': 'Go to the library',
  'downloads.state.QUEUED': 'queued',
  'downloads.state.DOWNLOADING': 'downloading',
  'downloads.state.FINISHED': 'done',
  'downloads.state.ERROR': 'error',
  'downloads.tries': '· attempt {n}',

  // --- extensions ----------------------------------------------------------
  'ext.title': 'Extensions',
  'ext.searchPlaceholder': 'Search extensions…',
  'ext.allLanguages': 'All languages',
  'ext.sync': 'Sync with the repository',
  'ext.syncing': 'Syncing…',
  'ext.tab.installed': 'Installed ({n})',
  'ext.tab.updates': 'Updates ({n})',
  'ext.tab.available': 'Available ({n})',
  'ext.repoError': "Could not load the {name} repository's catalog: {error}",
  'ext.repoRetry': 'Try again',
  'ext.loadingCatalog': 'Loading catalog…',
  'ext.loading': 'Loading extensions…',
  'ext.empty.none': 'No extensions available',
  'ext.empty.noneBody':
    'Extensions come from the {name} repository. Use Sync to fetch them again.',
  'ext.empty.filtered': 'Nothing matches that filter',
  'ext.empty.filteredBody': 'Change the tab, the language or the search term.',
  'ext.empty.action': 'Sync',
  'ext.capped':
    'Showing {n} of {total}. Narrow the search or the language to see the rest.',
  'ext.footer': 'Extensions from the {name} repository',
  'ext.footerRegistering': ' · registering…',
  'ext.openCatalog': '· open catalog →',
  'ext.catalogs': '· {n} catalogs {arrow}',
  'ext.openCatalogHint': 'Open catalog',
  'ext.chooseLanguageHint': "Choose the catalog's language",
  'ext.obsolete': 'obsolete',
  'ext.adultContent': 'adult content',
  'ext.update': 'Update',
  'ext.install': 'Install',
  'ext.uninstall': 'Uninstall',

  // --- update filters ------------------------------------------------------
  'filters.button': 'Filters',
  'filters.buttonCount': 'Filters ({n})',
  'filters.title': 'Update filters',
  'filters.close': 'Close',
  'filters.intro': 'Titles matching any of these will not be updated.',
  'filters.unread': 'Skip with unread chapters',
  'filters.unreadHelp': 'Ignores titles that still have chapters pending.',
  'filters.notStarted': 'Skip not started',
  'filters.notStartedHelp': 'Ignores titles you have never opened.',
  'filters.completed': 'Skip completed',
  'filters.completedHelp': 'Ignores titles the source marks as finished.',
  'filters.allOn': 'With all three on, practically nothing gets updated.',

  // --- reader --------------------------------------------------------------
  'reader.exit': 'Leave reader',
  'reader.loading': 'Loading…',
  'reader.noPages': 'No pages.',
  'reader.page': 'Page {n}',
  'reader.prevPage': 'Previous page',
  'reader.nextPage': 'Next page',
  'reader.prevChapter': '← Previous chapter',
  'reader.nextChapter': 'Next chapter →',
  'reader.mode.paged-rtl': 'Paged ←  (manga)',
  'reader.mode.paged-ltr': 'Paged  →',
  'reader.mode.continuous': 'Continuous ↓',
  'reader.fit.width': 'Width',
  'reader.fit.height': 'Height',
  'lang.multi': 'Multi-language',
  'update.title': 'A new version is available',
  'update.body': 'Kagami {latest} is out. You are on {current}.',
  'update.action': 'See what changed',
  'update.dismiss': 'Not now',
  'reader.fit.original': 'Original',
  'reader.zoomReset': 'Ctrl + mouse wheel zooms · click to reset to 100%',
  'reader.autoLongStrip':
    'Long-strip chapter detected: continuous, fitted to width. Changing this takes over.',
  'reader.maxWidth.natural': 'Never upscale',
  'reader.maxWidth.800': 'Max 800px',
  'reader.maxWidth.1000': 'Max 1000px',
  'reader.maxWidth.1200': 'Max 1200px',
  'reader.maxWidth.1400': 'Max 1400px',
  'reader.maxWidth.full': 'Full width',

  // --- publication status --------------------------------------------------
  'status.ONGOING': 'Ongoing',
  'status.COMPLETED': 'Completed',
  'status.LICENSED': 'Licensed',
  'status.PUBLISHING_FINISHED': 'Publishing finished',
  'status.CANCELLED': 'Cancelled',
  'status.ON_HIATUS': 'On hiatus',
  'status.UNKNOWN': 'Unknown',

  'error.unknown': 'Unknown failure',
}
