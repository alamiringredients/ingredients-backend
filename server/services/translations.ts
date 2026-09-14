import 'server-only'
import {DB} from '@holo-js/db'

function translationRows(rows: Record<string, unknown>[]) {
  const result = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    const key = String(row.translation_key)
    const entry = result.get(key) ?? {translation_key: key, page: row.page, source: row.source}
    entry[String(row.locale)] = row.value
    result.set(key, entry)
  }
  return [...result.values()]
}

export async function getTranslationRows(page?: string) {
  let query = DB.table('content_translations')
    .join('content_translation_values', 'content_translation_values.translation_id', '=', 'content_translations.id')
    .select('translation_key', 'page', 'source', 'locale', 'value').orderBy('page').orderBy('translation_key')
  if (page) query = query.where('page', page)
  return translationRows(await query.get())
}
