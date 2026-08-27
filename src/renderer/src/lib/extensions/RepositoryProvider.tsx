import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import {
  ADD_EXTENSION_STORE_MUTATION,
  EXTENSION_STORES_QUERY,
  FETCH_EXTENSIONS_MUTATION,
} from '@/lib/gql/operations/extensions'
import type {
  AddExtensionStoreMutation,
  ExtensionStoresQuery,
  FetchExtensionsMutation,
} from '@/lib/gql/generated/graphql'

/**
 * The community repository that took over after official Tachiyomi ended. It
 * is where practically every extension anyone would use today comes from.
 */
export const REPOSITORY = {
  name: 'Keiyoushi',
  indexUrl: 'https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json',
}

type RepositoryState = {
  name: string
  registered: boolean
  registering: boolean
  error: Error | null
  retry: () => void
}

const Ctx = createContext<RepositoryState>({
  name: REPOSITORY.name,
  registered: false,
  registering: false,
  error: null,
  retry: () => {},
})

export const useRepository = (): RepositoryState => useContext(Ctx)

/**
 * Registers the extension repository on its own, on first run.
 *
 * Asking the user "which repository do you want your extensions from?" hands
 * them a decision they have no way to make: the answer is almost always the
 * same, and getting it wrong means an app with no sources at all. So we choose,
 * and the Extensions screen simply reports what the choice was.
 */
export function RepositoryProvider({ children }: { children: ReactNode }): ReactNode {
  const qc = useQueryClient()

  const stores = useQuery({
    queryKey: ['extension-stores'],
    queryFn: () => request<ExtensionStoresQuery>(EXTENSION_STORES_QUERY),
  })

  const registration = useMutation({
    mutationFn: async () => {
      await request<AddExtensionStoreMutation>(ADD_EXTENSION_STORE_MUTATION, {
        indexUrl: REPOSITORY.indexUrl,
      })
      // The server does not reconcile the catalog on its own: without this call
      // the extension list stays empty after registering the repository.
      await request<FetchExtensionsMutation>(FETCH_EXTENSIONS_MUTATION)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['extension-stores'] })
      void qc.invalidateQueries({ queryKey: ['extensions'] })
      void qc.invalidateQueries({ queryKey: ['sources'] })
    },
  })

  const nodes = stores.data?.extensionStores.nodes ?? []
  const registered = nodes.length > 0

  // One automatic attempt per session. Without the guard, a network failure
  // would become a re-registration loop on every refetch of the list.
  const attempted = useRef(false)
  const { mutate: register } = registration
  useEffect(() => {
    if (!stores.isSuccess || registered || attempted.current) return
    attempted.current = true
    register()
  }, [stores.isSuccess, registered, register])

  return (
    <Ctx.Provider
      value={{
        name: nodes[0]?.name ?? REPOSITORY.name,
        registered,
        registering: registration.isPending,
        error: (registration.error as Error | null) ?? null,
        retry: () => register(),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
