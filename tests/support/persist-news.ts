import {DB} from '@holo-js/db'
import {newsLocales, type NewsContent} from '../../lib/news/contracts'
import {getNewsRecords} from '../../server/services/news/records'
import NewsArticle from '../../server/models/NewsArticle'
import NewsArticleTranslation from '../../server/models/NewsArticleTranslation'
import NewsPublication from '../../server/models/NewsPublication'
import NewsRevision from '../../server/models/NewsRevision'

export async function persistNews({id, revision, slug, content, operation, locale}: {
  id: number
  revision: number
  slug: string
  content: NewsContent
  operation: 'save' | 'publish' | 'unpublish'
  locale: 'en' | 'ar' | 'fr'
}) {
  return DB.writeTransaction(async () => {
    const current = id ? await NewsArticle.find(id) : null
    if (id && !current) throw new Error('Article not found.')
    if (current && Number(current.revision) !== revision) throw new Error('This article changed in another session. Reload before saving.')
    if (current && current.slug !== slug) throw new Error('Existing article URLs are permanent.')

    const existing = current ? (await getNewsRecords(id))[0] : undefined
    const links = await NewsArticle.select('id', 'slug').get()
    const idBySlug = new Map(links.map(article => [article.slug, Number(article.id)]))
    const linkedId = (value: string) => value ? idBySlug.get(value) ?? null : null
    const nextRevision = revision + 1
    const values = {
      slug,
      revision: nextRevision,
      category_id: content.categoryId || null,
      article_date: new Date(`${content.date}T00:00:00.000Z`),
      featured: content.featured,
      previous_article_id: linkedId(content.previousSlug),
      next_article_id: linkedId(content.nextSlug),
    }
    const article = current ?? await NewsArticle.create(values)
    if (current) await article.update(values)

    for (const language of newsLocales) {
      await NewsArticleTranslation.upsert(
        {article_id: Number(article.id), locale: language},
        {content: content.locales[language]},
      )
    }
    await article.tags().sync(content.tagIds)
    const relatedIds = content.relatedSlugs.map(linkedId).filter((relatedId): relatedId is number => relatedId !== null)
    await article.related().sync(relatedIds)

    const published = {...existing?.published}
    if (operation === 'publish') {
      const {locales, ...metadata} = content
      await NewsPublication.upsert(
        {article_id: Number(article.id), locale},
        {
          revision: nextRevision,
          article_date: new Date(`${content.date}T00:00:00.000Z`),
          category_id: content.categoryId,
          featured: content.featured,
          metadata,
          content: locales[locale],
          published_at: new Date(),
        },
      )
      published[locale] = locales[locale]
    } else if (operation === 'unpublish') {
      await NewsPublication.where('article_id', article.id).where('locale', locale).delete()
      delete published[locale]
    }

    if (existing) {
      await NewsRevision.create({article_id: Number(article.id), revision: existing.revision, content: existing.content})
      const retained = await NewsRevision.where('article_id', article.id).orderBy('id', 'desc').limit(10).get()
      if (retained.length === 10) await NewsRevision.where('article_id', article.id).where('id', '<', retained.at(-1)!.id).delete()
    }
    return {id: Number(article.id), revision: nextRevision, content, published}
  })
}
