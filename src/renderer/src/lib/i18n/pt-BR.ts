/**
 * The base dictionary. It defines the key set — every other language is typed
 * as `Dictionary`, so a forgotten translation is a compile error rather than
 * missing text in production.
 *
 * Conventions:
 * - `{x}` is filled in by `t('key', { x: value })`.
 * - `_one` / `_other` suffixes are picked by `tp()` via `Intl.PluralRules`.
 */
export const ptBR = {
  // --- navigation -----------------------------------------------------------
  'nav.library': 'Biblioteca',
  'nav.browse': 'Explorar',
  'nav.downloads': 'Downloads',
  'nav.extensions': 'Extensões',
  'nav.language': 'Idioma',

  // --- startup -------------------------------------------------------
  'gate.loading': 'Preparando a biblioteca…',
  'gate.retry': 'Tentar novamente',
  'gate.error.bundle':
    'Bundle do Suwayomi-Server não encontrado. Esperado em resources/server/ (produção) ou ../server/ (desenvolvimento).',
  'gate.error.jvm': 'Falha ao iniciar a JVM: {detail}',
  'gate.error.exit': 'O servidor encerrou inesperadamente ({detail}).',
  'gate.error.timeout': 'O servidor não respondeu em {detail}s.',
  'gate.error.unknown': 'Falha ao iniciar o servidor.',

  // --- library ----------------------------------------------------------
  'library.title': 'Biblioteca',
  'library.count_one': '{n} título',
  'library.count_other': '{n} títulos',
  'library.unread_one': '{n} não lido',
  'library.unread_other': '{n} não lidos',
  'library.skipped': '· {n} pulados',
  'library.stop': 'Parar',
  'library.updatedAt': 'Atualizado em {date}',
  'library.neverUpdated': 'Nunca atualizada',
  'library.offline': 'Sem conexão de tempo real',
  'library.update': 'Atualizar',
  'library.starting': 'Iniciando…',
  'library.loading': 'Carregando biblioteca…',
  'library.empty.title': 'Sua biblioteca está vazia',
  'library.empty.body':
    'Procure um título em Explorar e adicione-o aqui para acompanhar os capítulos novos.',
  'library.empty.action': 'Ir para Explorar',
  'library.nothingUpdated.excluded_one':
    'Nada foi atualizado: {n} mangá foi excluído pelos filtros. Ajuste em Filtros.',
  'library.nothingUpdated.excluded_other':
    'Nada foi atualizado: {n} mangás foram excluídos pelos filtros. Ajuste em Filtros.',
  'library.nothingUpdated.none':
    'Nada foi atualizado: nenhum mangá se qualificou pelos filtros. Ajuste em Filtros.',

  // --- cover grid ------------------------------------------------------
  'grid.empty': 'Nada por aqui ainda.',
  'grid.progress': '{read} de {total} capítulos lidos',
  'grid.inLibrary': 'na biblioteca',

  // --- browse ------------------------------------------------------------
  'browse.title': 'Explorar',
  'browse.placeholder': 'Buscar em todas as fontes deste idioma… (vazio = populares)',
  'browse.search': 'Buscar',
  'browse.progress': '{done}/{total} fontes',
  'browse.results': '{withResults} de {total} com resultados',
  'browse.loadingSources': 'Carregando fontes…',
  'browse.noSources.title': 'Nenhuma fonte instalada',
  'browse.noSources.body':
    'As fontes vêm das extensões. Instale uma para começar a procurar títulos.',
  'browse.noSources.action': 'Ver extensões',

  // --- one source's row --------------------------------------------------
  'source.searching': 'buscando…',
  'source.failed': 'falhou',
  'source.noResults': 'nenhum resultado',
  'source.seeMore': 'Ver mais →',

  // --- one source's catalog -----------------------------------------------
  'catalog.backToExtensions': 'Voltar para Extensões',
  'catalog.backToSearch': 'Voltar para a busca global',
  'catalog.source': 'Fonte',
  'catalog.placeholder': 'Buscar nesta fonte… (vazio = populares)',
  'catalog.loading': 'Carregando…',
  'catalog.empty.title': 'Nenhum resultado nesta fonte',
  'catalog.empty.searched': 'Tente outro termo, ou limpe o campo para ver os títulos populares.',
  'catalog.empty.popular': 'A fonte não devolveu nada. Pode estar fora do ar.',
  'catalog.loadingMore': 'Carregando mais…',
  'catalog.end': 'Fim dos resultados.',

  // --- manga detail ----------------------------------------------------
  'manga.back': 'Voltar',
  'manga.loading': 'Carregando…',
  'manga.notFound': 'Mangá não encontrado.',
  'manga.unknownAuthor': 'Autor desconhecido',
  'manga.read': 'lidos',
  'manga.downloaded': '{n} baixados',
  'manga.continue': 'Continuar',
  'manga.start': 'Começar a ler',
  'manga.inLibrary': 'Na biblioteca',
  'manga.addToLibrary': 'Adicionar à biblioteca',
  'manga.more': 'Mais',
  'manga.less': 'Menos',
  'manga.chapters_one': '{n} capítulo',
  'manga.chapters_other': '{n} capítulos',
  'manga.fetching': 'Buscando na fonte…',

  // --- chapter list --------------------------------------------------
  'chapters.empty': 'Nenhum capítulo encontrado.',
  'chapters.label': 'Cap. {n}',
  'chapters.page': '· pág. {n}',
  'chapters.pageOf': '· pág. {n}/{total}',
  'chapters.downloaded': 'baixado',
  'chapters.cancelDownload': 'Cancelar download',
  'chapters.deleteDownload': 'Excluir download',
  'chapters.download': 'Baixar capítulo',
  'chapters.markRead': 'Marcar como lido',
  'chapters.markUnread': 'Marcar como não lido',

  // --- downloads -----------------------------------------------------------
  'downloads.title': 'Downloads',
  'downloads.queued_one': '{n} na fila',
  'downloads.queued_other': '{n} na fila',
  'downloads.reconnecting': 'reconectando…',
  'downloads.reconnectingHint':
    'Sem conexão de tempo real; o progresso pode estar defasado',
  'downloads.pause': 'Pausar',
  'downloads.start': 'Iniciar',
  'downloads.clear': 'Limpar fila',
  'downloads.remove': 'Remover da fila',
  'downloads.empty.title': 'A fila está vazia',
  'downloads.empty.body': 'Baixe capítulos pela tela de um mangá para lê-los sem internet.',
  'downloads.empty.action': 'Ir para a biblioteca',
  'downloads.state.QUEUED': 'na fila',
  'downloads.state.DOWNLOADING': 'baixando',
  'downloads.state.FINISHED': 'concluído',
  'downloads.state.ERROR': 'erro',
  'downloads.tries': '· {n}ª tentativa',

  // --- extensions -----------------------------------------------------------
  'ext.title': 'Extensões',
  'ext.searchPlaceholder': 'Buscar extensão…',
  'ext.allLanguages': 'Todos os idiomas',
  'ext.sync': 'Sincronizar com o repositório',
  'ext.syncing': 'Sincronizando…',
  'ext.tab.installed': 'Instaladas ({n})',
  'ext.tab.updates': 'Atualizações ({n})',
  'ext.tab.available': 'Disponíveis ({n})',
  'ext.repoError': 'Não deu para carregar o catálogo do repositório {name}: {error}',
  'ext.repoRetry': 'Tentar de novo',
  'ext.loadingCatalog': 'Carregando catálogo…',
  'ext.loading': 'Carregando extensões…',
  'ext.empty.none': 'Nenhuma extensão disponível',
  'ext.empty.noneBody':
    'As extensões vêm do repositório {name}. Use Sincronizar para buscá-las de novo.',
  'ext.empty.filtered': 'Nada com esse filtro',
  'ext.empty.filteredBody': 'Troque a aba, o idioma ou o termo de busca.',
  'ext.empty.action': 'Sincronizar',
  'ext.capped': 'Mostrando {n} de {total}. Refine a busca ou o idioma para ver as demais.',
  'ext.footer': 'Extensões do repositório {name}',
  'ext.footerRegistering': ' · cadastrando…',
  'ext.openCatalog': '· abrir catálogo →',
  'ext.catalogs': '· {n} catálogos {arrow}',
  'ext.openCatalogHint': 'Abrir catálogo',
  'ext.chooseLanguageHint': 'Escolher o idioma do catálogo',
  'ext.obsolete': 'obsoleta',
  'ext.adultContent': 'conteúdo adulto',
  'ext.update': 'Atualizar',
  'ext.install': 'Instalar',
  'ext.uninstall': 'Desinstalar',

  // --- update filters ----------------------------------------------
  'filters.button': 'Filtros',
  'filters.buttonCount': 'Filtros ({n})',
  'filters.title': 'Filtros de atualização',
  'filters.close': 'Fechar',
  'filters.intro': 'Mangás que se encaixarem nestes casos não serão atualizados.',
  'filters.unread': 'Pular com capítulos não lidos',
  'filters.unreadHelp': 'Ignora mangás que ainda têm capítulos pendentes.',
  'filters.notStarted': 'Pular não começados',
  'filters.notStartedHelp': 'Ignora mangás que você nunca abriu.',
  'filters.completed': 'Pular concluídos',
  'filters.completedHelp': 'Ignora mangás marcados como finalizados na fonte.',
  'filters.allOn': 'Com os três ativos, praticamente nada é atualizado.',

  // --- reader --------------------------------------------------------------
  'reader.exit': 'Sair do leitor',
  'reader.loading': 'Carregando…',
  'reader.noPages': 'Sem páginas.',
  'reader.page': 'Página {n}',
  'reader.prevPage': 'Página anterior',
  'reader.nextPage': 'Próxima página',
  'reader.prevChapter': '← Capítulo anterior',
  'reader.nextChapter': 'Próximo capítulo →',
  'reader.mode.paged-rtl': 'Paginado ←  (mangá)',
  'reader.mode.paged-ltr': 'Paginado  →',
  'reader.mode.continuous': 'Contínuo ↓',
  'reader.fit.width': 'Largura',
  'reader.fit.height': 'Altura',
  'lang.multi': 'Multi-idioma',
  'update.title': 'Nova versão disponível',
  'update.body': 'Kagami {latest} foi publicado. Você está na {current}.',
  'update.action': 'Ver novidades',
  'update.dismiss': 'Agora não',
  'reader.fit.original': 'Original',
  'reader.zoomReset': 'Ctrl + roda do mouse amplia · clique para voltar a 100%',
  'reader.autoLongStrip':
    'Capítulo em tira longa detectado: contínuo, ajustado pela largura. Trocar aqui assume o controle.',
  'reader.maxWidth.natural': 'Sem ampliar',
  'reader.maxWidth.800': 'Max 800px',
  'reader.maxWidth.1000': 'Max 1000px',
  'reader.maxWidth.1200': 'Max 1200px',
  'reader.maxWidth.1400': 'Max 1400px',
  'reader.maxWidth.full': 'Tela cheia',

  // --- publication status ------------------------------------------
  'status.ONGOING': 'Em andamento',
  'status.COMPLETED': 'Completo',
  'status.LICENSED': 'Licenciado',
  'status.PUBLISHING_FINISHED': 'Publicação encerrada',
  'status.CANCELLED': 'Cancelado',
  'status.ON_HIATUS': 'Em hiato',
  'status.UNKNOWN': 'Desconhecido',

  'error.unknown': 'Falha desconhecida',
} as const
