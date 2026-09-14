import 'server-only'
import {pageSize} from '@/lib/admin/pagination'
import {createPaginator, type TableQueryBuilder} from '@holo-js/db'
import type {ListSearchParams, SubmissionPagination} from '@/lib/admin/submission-list'
import type {CrudFilter} from '@/lib/admin/crud-index'

export function listValue(params: ListSearchParams, key: string) {
  return typeof params[key] === 'string' ? params[key].trim().slice(0, 200) : ''
}

export async function paginateCrud(query: TableQueryBuilder, params: ListSearchParams, filters: CrudFilter[], search: (query: TableQueryBuilder, pattern: string) => TableQueryBuilder, applyFilter: (query: TableQueryBuilder, key: string, value: string) => TableQueryBuilder) {
  const text = listValue(params, 'q')
  const selected: Record<string, string> = {}
  for (const filter of filters) {
    const value = listValue(params, filter.key)
    selected[filter.key] = filter.options.some(option => option.value === value) ? value : ''
    if (selected[filter.key]) query = applyFilter(query, filter.key, value)
  }
  for (const word of text.split(/\s+/).filter(Boolean)) query = search(query, `%${word.replace(/[\\%_]/g, '\\$&')}%`)
  const requested = Number(listValue(params, 'page'))
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1
  const result = await paginateQuery(query, page, listValue(params, 'perPage'))
  const pagination: SubmissionPagination = {meta: result.meta, query: text, filters: selected}
  return {rows: result.data, pagination}
}

// Holo 0.3.15 paginate()/count() materialize rows. Use its SQL aggregate and
// limit/offset builders, then its public paginator constructor.
export async function countQuery(query: TableQueryBuilder) {
  const row = await query.reorder().selectCount('total').first()
  return Number(row?.total ?? 0)
}

export async function paginateQuery(query: TableQueryBuilder, requestedPage: number, size?: unknown) {
  const perPage = pageSize(size)
  const total = await countQuery(query)
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(requestedPage, lastPage)
  const offset = (currentPage - 1) * perPage
  const data = await query.limit(perPage).offset(offset).get()
  return createPaginator(data, {total, perPage, currentPage, lastPage, pageName: 'page', from: data.length ? offset + 1 : null, to: data.length ? offset + data.length : null, hasMorePages: currentPage < lastPage})
}
