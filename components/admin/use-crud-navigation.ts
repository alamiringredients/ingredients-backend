'use client'
import {defaultPageSize} from '@/lib/admin/pagination'
import {useEffect, useRef, useState, useTransition} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import type {SubmissionPagination} from '@/lib/admin/submission-list'

export function useCrudNavigation(pagination: SubmissionPagination) {
  const router = useRouter(), pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState(pagination.query)
  const [selected, setSelected] = useState(pagination.filters)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!pending && timer.current === undefined) {setQuery(pagination.query); setSelected(pagination.filters)}
  }, [pagination, pending])
  useEffect(() => () => clearTimeout(timer.current), [])
  const href = (page: number, text = query, filters = selected, size = pagination.meta.perPage) => {
    const params = new URLSearchParams()
    if (text.trim()) params.set('q', text.trim())
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
    if (size !== defaultPageSize) params.set('perPage', String(size))
    if (page > 1) params.set('page', String(page))
    return `${pathname}${params.size ? `?${params}` : ''}`
  }
  const change = (text: string, filters: Record<string, string>, delay = 0) => {
    setQuery(text); setSelected(filters)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = undefined
      startTransition(() => router.replace(href(1, text, filters), {scroll: false}))
    }, delay)
  }
  const changePageSize = (size: number) => {
    clearTimeout(timer.current)
    timer.current = undefined
    startTransition(() => router.replace(href(1, query, selected, size), {scroll: false}))
  }
  return {query, selected, pending, href, change, changePageSize}
}
