import 'server-only'
import {databaseDate} from '@/server/support/database-date'
import {decode, type NewsContent, type NewsRecord, type NewsVersion} from '@/lib/news/contracts'
import type {CmsLocale} from '@/lib/cms/contracts'
import NewsArticle from '@/server/models/NewsArticle'

export async function getNewsRecords(articleId?: number): Promise<NewsRecord[]> {
  let query = NewsArticle
    .with('translations', 'publications', 'tags', 'related', 'previous', 'next')
    .orderBy('id')
  if (articleId !== undefined) query = query.where('id', articleId)
  const articles = await query.getJson() as unknown as Record<string, unknown>[]

  return articles.map(row => {
    const translations = row.translations as Record<string, unknown>[]
    const publications = row.publications as Record<string, unknown>[]
    const tags = row.tags as Record<string, unknown>[]
    const related = row.related as Record<string, unknown>[]
    const content: NewsContent = {
      categoryId: Number(row.category_id ?? 0),
      featured: Boolean(row.featured),
      date: databaseDate(row.article_date),
      previousSlug: String((row.previous as Record<string, unknown> | null)?.slug ?? ''),
      nextSlug: String((row.next as Record<string, unknown> | null)?.slug ?? ''),
      tagIds: tags.map(tag => Number(tag.id)),
      relatedSlugs: related.map(article => String(article.slug)),
      locales: Object.fromEntries(translations.map(item => [
        String(item.locale),
        decode<NewsVersion>(item.content),
      ])) as Record<CmsLocale, NewsVersion>,
    }
    return {
      id: Number(row.id),
      slug: String(row.slug),
      revision: Number(row.revision),
      content,
      published: Object.fromEntries(publications.map(item => [
        String(item.locale),
        decode<NewsVersion>(item.content),
      ])),
    }
  })
}
