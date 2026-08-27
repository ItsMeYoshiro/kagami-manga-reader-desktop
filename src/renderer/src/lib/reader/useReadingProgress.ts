import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { SAVE_PROGRESS_MUTATION } from '@/lib/gql/operations/reader'
import type { SaveProgressMutation } from '@/lib/gql/generated/graphql'

/** How long to wait before writing, so we do not save on every page turn. */
const DEBOUNCE_MS = 800

type Progress = { id: number; lastPageRead: number; isRead: boolean | null }

/**
 * Persists reading position for the open chapter.
 *
 * Lives apart from the Reader component because it is the one piece there that
 * has nothing to do with drawing pages, and it carries two rules that are easy
 * to break by accident:
 *
 *  - **it never un-reads a chapter.** `isRead` is `false` for the server means
 *    "not read", but `null` means "leave it alone". Sending `false` here would
 *    clear the read flag on a finished chapter just because the user opened it
 *    to glance at something.
 *  - **it flushes on unmount.** Leaving the reader inside the debounce window
 *    would otherwise throw away the last few pages of progress.
 */
export function useReadingProgress(
  mangaId: number,
  chapterId: number,
  index: number,
  pageCount: number,
): void {
  const qc = useQueryClient()

  const save = useMutation({
    mutationFn: (vars: Progress) => request<SaveProgressMutation>(SAVE_PROGRESS_MUTATION, vars),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['manga', mangaId] })
      void qc.invalidateQueries({ queryKey: ['library'] })
    },
  })

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Progress | null>(null)
  const { mutate: persist } = save

  useEffect(() => {
    if (pageCount === 0 || !Number.isFinite(chapterId)) return
    pending.current = {
      id: chapterId,
      lastPageRead: index,
      isRead: index >= pageCount - 1 ? true : null,
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (pending.current) persist(pending.current)
    }, DEBOUNCE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [index, pageCount, chapterId, persist])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      const p = pending.current
      if (p) {
        void request(SAVE_PROGRESS_MUTATION, p).catch(() => {
          /* leaving the reader: there is no UI left to report a write failure */
        })
      }
    }
  }, [])
}
