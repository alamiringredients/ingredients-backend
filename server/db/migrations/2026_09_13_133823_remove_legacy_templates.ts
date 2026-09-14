import {DB, defineMigration} from '@holo-js/db'

export default defineMigration({
  async up() {
    const columns = [
      ['home_sections', 'content'],
      ['website_settings', 'value'],
      ['product_category_translations', 'content'],
      ['product_translations', 'content'],
      ['news_taxonomies', 'content'],
      ['news_article_translations', 'content'],
      ['news_publications', 'metadata'],
      ['news_publications', 'content'],
      ['news_revisions', 'content'],
      ['career_jobs', 'content'],
      ['sustainability_article_translations', 'content'],
      ['sustainability_publications', 'metadata'],
      ['sustainability_publications', 'content'],
      ['sustainability_revisions', 'content'],
      ['events', 'content'],
    ] as const

    for (const [table, column] of columns) {
      const rows = await DB.table(table).select('id', column).get()

      for (const row of rows) {
        const stored = row[column]
        const content = typeof stored === 'string' ? JSON.parse(stored) : stored
        const serialized = JSON.stringify(content)
        const cleaned = JSON.parse(serialized, (key, value) => key === 'template' ? undefined : value)

        if (JSON.stringify(cleaned) !== serialized) {
          await DB.table(table).where('id', Number(row.id)).update({[column]: JSON.stringify(cleaned)})
        }
      }
    }
  },
  async down() {},
})
