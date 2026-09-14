import 'server-only'
import {DB} from '@holo-js/db'
import type {TranslationEntry} from '@/lib/translation-catalog'
import type {ListSearchParams} from '@/lib/admin/submission-list'
import {listValue, paginateCrud} from '@/server/admin/crud-query'

export async function getTranslationList(params: ListSearchParams) {
  const pages = await DB.table('content_translations').select('page').distinct().orderBy('page').get()
  const locale = ['en', 'ar', 'fr'].includes(listValue(params, 'locale')) ? listValue(params, 'locale') : 'ar'
  const filters = [{key: 'section', label: 'Page', options: pages.map(row => ({value: String(row.page), label: String(row.page)}))}, {key: 'locale', label: 'Language', options: ['en', 'ar', 'fr'].map(value => ({value, label: value}))}]
  const result = await paginateCrud(DB.table('content_translations as r').select('r.id', 'r.translation_key', 'r.page', 'r.source').orderBy('r.page').orderBy('r.translation_key'), {...params, locale}, filters,
    (query, pattern) => query.where(group => group.where('r.translation_key', 'like', pattern).orWhere('r.source', 'like', pattern).orWhereExists(DB.table('content_translation_values').select('translation_id').whereColumn('translation_id', '=', 'r.id').where('locale', locale).where('value', 'like', pattern))),
    (query, key, value) => key === 'section' ? query.where('r.page', value) : query)
  const translations = result.rows.length ? await DB.table('content_translation_values').select('translation_id', 'locale', 'value').whereIn('translation_id', result.rows.map(row => Number(row.id))).get() : []
  const entries: TranslationEntry[] = result.rows.map(row => ({key: String(row.translation_key), page: String(row.page), source: String(row.source), translations: Object.fromEntries(translations.filter(value => value.translation_id === row.id).map(value => [String(value.locale), String(value.value)])) as TranslationEntry['translations']}))
  return {entries, pagination: result.pagination, pages: pages.map(row => String(row.page))}
}
