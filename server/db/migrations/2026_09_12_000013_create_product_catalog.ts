import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('product_categories', t => {
      t.id()
      t.string('seed_key').nullable().unique()
      t.string('slug').unique()
      t.boolean('published').default(false)
      t.integer('sort_order').default(0)
      t.timestamps()
      t.index(['published', 'sort_order', 'id'])
    })
    await schema.createTable('products', t => {
      t.id()
      t.string('seed_key').nullable().unique()
      t.bigInteger('category_id')
      t.string('slug')
      t.boolean('published').default(false)
      t.integer('sort_order').default(0)
      t.timestamps()
      t.unique(['category_id', 'slug'])
      t.index(['category_id', 'published', 'sort_order', 'id'])
      t.foreign('category_id').references('id').on('product_categories').onDelete('restrict')
    })
    for (const [table, parent, key] of [
      ['product_category_translations', 'product_categories', 'category_id'],
      ['product_translations', 'products', 'product_id'],
    ] as const) {
      await schema.createTable(table, t => {
        t.id()
        t.bigInteger(key)
        t.string('locale')
        t.string('name')
        t.text('description')
        t.text('seo_title')
        t.text('seo_description')
        t.json('content')
        t.timestamps()
        t.unique([key, 'locale'], `${key}_locale_unique`)
        t.index(['locale', 'name'])
        t.foreign(key).references('id').on(parent).onDelete('cascade')
      })
    }
    for (const [table, key] of [['product_applications', 'application_id'], ['concentration_ranges', 'concentration_id']] as const) {
      await schema.createTable(table, t => {
        t.id()
        t.string('slug').unique()
        t.boolean('is_active').default(true)
        t.integer('sort_order').default(0)
        t.timestamps()
      })
      await schema.createTable(table === 'product_applications' ? 'application_translations' : 'concentration_translations', t => {
        t.id()
        t.bigInteger(key)
        t.string('locale')
        t.string('name')
        t.unique([key, 'locale'], `${key}_locale_unique`)
        t.foreign(key).references('id').on(table).onDelete('cascade')
      })
      await schema.createTable(table === 'product_applications' ? 'application_product' : 'concentration_product', t => {
        t.bigInteger('product_id')
        t.bigInteger(key)
        t.integer('sort_order').default(0)
        t.unique(['product_id', key])
        t.index([key, 'product_id'])
        t.foreign('product_id').references('id').on('products').onDelete('cascade')
        t.foreign(key).references('id').on(table).onDelete('restrict')
      })
    }
  },
  async down({schema}) {
    for (const table of ['concentration_product', 'concentration_translations', 'concentration_ranges', 'application_product', 'application_translations', 'product_applications', 'product_translations', 'product_category_translations', 'products', 'product_categories']) await schema.dropTable(table)
  },
})
