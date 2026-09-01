import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReaderChapter } from './useChapterPages'

/** All the navigation needs of a chapter is a way to address it. */
interface Sibling {
  id: number
}

export interface ChapterNav {
  prevChapter: Sibling | null
  nextChapter: Sibling | null
  goChapter: (target: Sibling | null) => void
  /** Turns a page, or the chapter when the last page is already open. */
  nextPage: () => void
  prevPage: () => void
}

/**
 * Moving through a chapter, and out the far end of it.
 *
 * Turning the page and turning the chapter are one action, not two: reaching
 * the end of the last page and reaching the next chapter is the same gesture
 * from the reader's side, so `nextPage` handles both and callers never have
 * to check where they are.
 */
export function useChapterNav({
  mangaId,
  id,
  chapter,
  pageCount,
  setIndex,
}: {
  mangaId: string | undefined
  id: number
  chapter: ReaderChapter | undefined
  pageCount: number
  setIndex: Dispatch<SetStateAction<number>>
}): ChapterNav {
  const navigate = useNavigate()

  // sourceOrder is the real reading order: chapterNumber jumps (62 -> 1183)
  // when a source has gaps in its translations.
  const siblings = useMemo(() => {
    const nodes = chapter?.manga.chapters.nodes ?? []
    return [...nodes].sort((a, b) => a.sourceOrder - b.sourceOrder)
  }, [chapter])

  const position = siblings.findIndex((c) => c.id === id)
  const prevChapter = position > 0 ? siblings[position - 1] : null
  const nextChapter =
    position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null

  const goChapter = useCallback(
    (target: Sibling | null) => {
      if (!target) return
      // `replace`, so that leaving the reader goes back to the manga rather
      // than walking back through every chapter that was read.
      navigate(`/manga/${mangaId}/chapter/${target.id}`, { replace: true })
    },
    [navigate, mangaId],
  )

  const nextPage = useCallback(() => {
    setIndex((i) => {
      if (i < pageCount - 1) return i + 1
      goChapter(nextChapter)
      return i
    })
  }, [pageCount, nextChapter, goChapter, setIndex])

  const prevPage = useCallback(() => {
    setIndex((i) => {
      if (i > 0) return i - 1
      goChapter(prevChapter)
      return i
    })
  }, [prevChapter, goChapter, setIndex])

  return { prevChapter, nextChapter, goChapter, nextPage, prevPage }
}
