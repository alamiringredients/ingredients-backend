import {DB, defineSeeder} from '@holo-js/db'
import {cmsLocales} from '@/lib/cms/contracts'
import type {NewsRecord} from '@/lib/news/contracts'
import source from '../seed-data/site-content.json'
import NewsArticle from '@/server/models/NewsArticle'
import NewsArticleTranslation from '@/server/models/NewsArticleTranslation'
import NewsPublication from '@/server/models/NewsPublication'
import NewsTaxonomy from '@/server/models/NewsTaxonomy'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export default defineSeeder({
  name: 'news',
  async run() {
    const page = source.website_settings.find(row => row.setting_key === 'news')!
    await WebsiteSetting.firstOrCreate({setting_key: page.setting_key}, {value: page.value})

    await NewsTaxonomy.unguarded(async () => {
      for (const taxonomy of source.news_taxonomies) {
        if (!await NewsTaxonomy.find(taxonomy.id)) await DB.table('news_taxonomies').insert({...taxonomy, content: JSON.stringify(taxonomy.content)})
      }
    })

    const articles = source.news_articles as NewsRecord[]
    const idBySlug = new Map(articles.map(row => [row.slug, row.id]))
    const existing = new Set((await NewsArticle.select('id').get()).map(row => Number(row.id)))

    await NewsArticle.unguarded(async () => {
      for (const row of articles) {
        if (existing.has(row.id)) continue
        await DB.table('news_articles').insert({
          id: row.id,
          slug: row.slug,
          revision: row.revision,
          category_id: row.content.categoryId || null,
          article_date: new Date(`${row.content.date}T00:00:00.000Z`),
          featured: row.content.featured,
        })
      }

      for (const row of articles) {
        if (existing.has(row.id)) continue
        const article = await NewsArticle.findOrFail(row.id)
        const {locales: versions, ...metadata} = row.content
        await article.update({
          previous_article_id: idBySlug.get(metadata.previousSlug) ?? null,
          next_article_id: idBySlug.get(metadata.nextSlug) ?? null,
        })
        for (const locale of cmsLocales) {
          await NewsArticleTranslation.create({article_id: row.id, locale, content: versions[locale]})
          if (row.published[locale]) {
            await NewsPublication.create({
              article_id: row.id,
              locale,
              revision: row.revision,
              category_id: metadata.categoryId,
              article_date: new Date(`${metadata.date}T00:00:00.000Z`),
              featured: metadata.featured,
              metadata,
              content: row.published[locale],
              published_at: new Date(),
            })
          }
        }
        await article.tags().sync(metadata.tagIds)
        const relatedIds = metadata.relatedSlugs.map(slug => idBySlug.get(slug)!).filter(Boolean)
        await article.related().sync(relatedIds)
        for (const [sortOrder, relatedId] of relatedIds.entries()) {
          await article.related().updateExistingPivot(relatedId, {sort_order: sortOrder})
        }
      }
    })
  },
})
