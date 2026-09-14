import {cmsLocales, type CmsLocale} from '@/lib/cms/contracts'

/** Keep a single language in an editor document without changing its block structure. */
export function localizeContent(value: unknown, locale: CmsLocale): unknown {
  if (Array.isArray(value)) return value.map(item => localizeContent(item, locale))
  if (!value || typeof value !== 'object') return value
  const object = value as Record<string, unknown>
  if (cmsLocales.some(language => Object.hasOwn(object, language))) {
    return Object.hasOwn(object, locale) ? {[locale]: object[locale]} : {}
  }
  return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, localizeContent(item, locale)]))
}

/** Assemble language rows for the multilingual admin editor. Public reads use one row. */
export function mergeContent(left: unknown, right: unknown): unknown {
  if (Array.isArray(left) && Array.isArray(right)) return right.map((item, index) => mergeContent(left[index], item))
  if (left && right && typeof left === 'object' && typeof right === 'object' && !Array.isArray(left) && !Array.isArray(right)) {
    const result = {...left} as Record<string, unknown>
    for (const [key, value] of Object.entries(right)) result[key] = mergeContent(result[key], value)
    return result
  }
  return right
}
