export const pageSizes = [10, 25, 50, 100] as const
export const defaultPageSize = 25

export function pageSize(value: unknown) {
  const size = Number(value)
  return pageSizes.some(option => option === size) ? size : defaultPageSize
}

export function paginationPages(current: number, last: number): (number | 'ellipsis')[] {
  if (last <= 7) return Array.from({length: last}, (_, index) => index + 1)
  const start = Math.max(2, Math.min(current - 1, last - 4))
  const end = Math.min(last - 1, Math.max(current + 1, 5))
  const pages: (number | 'ellipsis')[] = [1]
  if (start > 2) pages.push('ellipsis')
  for (let page = start; page <= end; page++) pages.push(page)
  if (end < last - 1) pages.push('ellipsis')
  pages.push(last)
  return pages
}
