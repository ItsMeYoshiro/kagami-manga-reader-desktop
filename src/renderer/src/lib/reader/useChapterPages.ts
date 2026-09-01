import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { assetUrl, request } from '@/lib/gql/client'
import { FETCH_CHAPTER_PAGES_MUTATION, READER_CHAPTER_QUERY } from '@/lib/gql/operations/reader'
import type {
  FetchChapterPagesMutation,
  ReaderChapterQuery,
} from '@/lib/gql/generated/graphql'

/** The chapter as the reader sees it: its own fields plus its siblings. */
export type ReaderChapter = ReaderChapterQuery['chapter']

export interface ChapterPages {
  chapter: ReaderChapter | undefined
  /** Absolute URLs in reading order. Empty until the fetch resolves. */
  pages: string[]
  /** The page being read. */
  index: number
  setIndex: Dispatch<SetStateAction<number>>
  isLoading: boolean
  error: Error | null
}

/**
 * Loads one chapter: its metadata, its page URLs, and where to open it.
 *
 * The pages come from a mutation rather than a query because asking for them
 * can send the server off to the remote source.
 *
 * The page cursor lives in here, not in the route, because loading is what
 * decides it -- zero on arriving at a chapter, then the saved position once
 * the pages exist and there is finally something for that number to index.
 * Restoring any earlier would land on a page that is not there yet.
 */
export function useChapterPages(id: number): ChapterPages {
  const [index, setIndex] = useState(0)

  const chapterQuery = useQuery({
    queryKey: ['reader-chapter', id],
    queryFn: () => request<ReaderChapterQuery>(READER_CHAPTER_QUERY, { chapterId: id }),
    enabled: Number.isFinite(id),
  })
  const chapter = chapterQuery.data?.chapter

  const pagesMutation = useMutation({
    mutationFn: (target: number) =>
      request<FetchChapterPagesMutation>(FETCH_CHAPTER_PAGES_MUTATION, { chapterId: target }),
  })

  // Fires once per chapter. The ref stops a refetch when the effect re-runs
  // because the mutation's identity changed.
  const fetchedFor = useRef<number | null>(null)
  const { mutate: fetchPages } = pagesMutation
  useEffect(() => {
    if (!Number.isFinite(id) || fetchedFor.current === id) return
    fetchedFor.current = id
    setIndex(0)
    fetchPages(id)
  }, [id, fetchPages])

  const pages = useMemo(
    () => (pagesMutation.data?.fetchChapterPages?.pages ?? []).map((p) => assetUrl(p) ?? p),
    [pagesMutation.data],
  )

  // Resume where the reader left off, but only once the pages exist.
  const restored = useRef<number | null>(null)
  useEffect(() => {
    if (pages.length === 0 || !chapter || restored.current === id) return
    restored.current = id
    const saved = chapter.lastPageRead
    if (saved > 0 && saved < pages.length) setIndex(saved)
  }, [pages.length, chapter, id])

  return {
    chapter,
    pages,
    index,
    setIndex,
    isLoading: pagesMutation.isPending || chapterQuery.isLoading,
    // Only the page fetch is surfaced. A chapter whose metadata failed but
    // whose pages arrived is still readable, just without a title.
    error: (pagesMutation.error as Error | null) ?? null,
  }
}
