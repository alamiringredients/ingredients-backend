import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('news_taxonomies', t => {
      t.id(); t.string('kind'); t.string('slug'); t.integer('sort_order').default(0); t.json('content'); t.timestamps()
      t.unique(['kind', 'slug'])
    })
    await schema.createTable('news_articles', t => {
      t.id(); t.string('slug').unique(); t.integer('revision').default(0)
      t.bigInteger('category_id').nullable(); t.date('article_date'); t.boolean('featured').default(false)
      t.bigInteger('previous_article_id').nullable(); t.bigInteger('next_article_id').nullable(); t.timestamps()
      t.foreign('category_id').references('id').on('news_taxonomies').onDelete('restrict')
      t.foreign('previous_article_id').references('id').on('news_articles').onDelete('set null')
      t.foreign('next_article_id').references('id').on('news_articles').onDelete('set null')
      t.index(['article_date', 'id'])
    })
    await schema.createTable('news_article_translations', t => {
      t.id(); t.bigInteger('article_id'); t.string('locale'); t.json('content'); t.timestamps()
      t.unique(['article_id', 'locale'], 'news_article_locale_unique')
      t.foreign('article_id').references('id').on('news_articles').onDelete('cascade')
    })
    for (const [table, key, target] of [['news_article_tag', 'tag_id', 'news_taxonomies'], ['news_article_related', 'related_article_id', 'news_articles']] as const) {
      await schema.createTable(table, t => {
        t.bigInteger('article_id'); t.bigInteger(key); t.integer('sort_order').default(0)
        t.unique(['article_id', key]); t.index([key, 'article_id'])
        t.foreign('article_id').references('id').on('news_articles').onDelete('cascade')
        t.foreign(key).references('id').on(target).onDelete(table === 'news_article_tag' ? 'restrict' : 'cascade')
      })
    }
    await schema.createTable('news_publications', t => {
      t.id(); t.bigInteger('article_id'); t.string('locale'); t.integer('revision'); t.date('article_date')
      t.bigInteger('category_id'); t.boolean('featured'); t.json('metadata'); t.json('content'); t.timestamp('published_at')
      t.unique(['article_id', 'locale']); t.index(['locale', 'article_date', 'article_id'])
      t.foreign('article_id').references('id').on('news_articles').onDelete('cascade')
      t.foreign('category_id').references('id').on('news_taxonomies').onDelete('restrict')
    })
    await schema.createTable('news_revisions', t => {
      t.id(); t.bigInteger('article_id'); t.integer('revision'); t.json('content'); t.timestamps()
      t.unique(['article_id', 'revision']); t.index(['article_id', 'id'])
      t.foreign('article_id').references('id').on('news_articles').onDelete('cascade')
    })
  },
  async down({schema}) {
    for (const table of ['news_revisions', 'news_publications', 'news_article_related', 'news_article_tag', 'news_article_translations', 'news_articles', 'news_taxonomies']) await schema.dropTable(table)
  },
})
