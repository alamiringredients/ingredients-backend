import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('sustainability_goals', t => {
      t.id(); t.string('color'); t.string('image'); t.integer('sort_order').default(0)
    })
    await schema.createTable('sustainability_goal_translations', t => {
      t.id(); t.bigInteger('goal_id'); t.string('locale'); t.string('name'); t.text('alt')
      t.unique(['goal_id', 'locale'], 'sustainability_goal_locale_unique')
      t.foreign('goal_id').references('id').on('sustainability_goals').onDelete('cascade')
    })
    await schema.createTable('sustainability_articles', t => {
      t.id(); t.string('slug').unique(); t.integer('revision').default(0); t.date('article_date'); t.date('updated_date')
      t.integer('sort_order').default(0); t.boolean('featured').default(false); t.bigInteger('primary_goal_id').nullable(); t.timestamps()
      t.foreign('primary_goal_id').references('id').on('sustainability_goals').onDelete('restrict')
      t.index(['featured', 'sort_order', 'id'])
    })
    await schema.createTable('sustainability_article_translations', t => {
      t.id(); t.bigInteger('article_id'); t.string('locale'); t.json('content'); t.timestamps()
      t.unique(['article_id', 'locale'], 'sustainability_article_locale_unique')
      t.foreign('article_id').references('id').on('sustainability_articles').onDelete('cascade')
    })
    await schema.createTable('sustainability_article_goal', t => {
      t.bigInteger('article_id'); t.bigInteger('goal_id'); t.integer('sort_order').default(0)
      t.unique(['article_id', 'goal_id']); t.index(['goal_id', 'article_id'])
      t.foreign('article_id').references('id').on('sustainability_articles').onDelete('cascade')
      t.foreign('goal_id').references('id').on('sustainability_goals').onDelete('restrict')
    })
    await schema.createTable('sustainability_publications', t => {
      t.id(); t.bigInteger('article_id'); t.string('locale'); t.integer('revision'); t.date('article_date')
      t.boolean('featured'); t.integer('sort_order'); t.json('metadata'); t.json('content'); t.timestamp('published_at')
      t.unique(['article_id', 'locale'], 'sustainability_publication_locale_unique')
      t.index(['locale', 'featured', 'sort_order', 'article_id'], 'sustainability_publication_listing_index')
      t.foreign('article_id').references('id').on('sustainability_articles').onDelete('cascade')
    })
    await schema.createTable('sustainability_revisions', t => {
      t.id(); t.bigInteger('article_id'); t.integer('revision'); t.json('content'); t.timestamps()
      t.unique(['article_id', 'revision']); t.index(['article_id', 'id'])
      t.foreign('article_id').references('id').on('sustainability_articles').onDelete('cascade')
    })
  },
  async down({schema}) {
    for (const table of ['sustainability_revisions', 'sustainability_publications', 'sustainability_article_goal', 'sustainability_article_translations', 'sustainability_articles', 'sustainability_goal_translations', 'sustainability_goals']) await schema.dropTable(table)
  },
})
