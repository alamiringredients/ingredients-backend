import {DB, defineMigration} from '@holo-js/db'
import {removeDecorativeFields} from '@/lib/cms/decorative-fields'

export default defineMigration({
  async up() {
    for (const [table, column] of [['home_sections', 'content'], ['website_settings', 'value'], ['product_translations', 'content'], ['product_category_translations', 'content']] as const) {
      const rows = await DB.table(table).select('id', column).get()
      for (const row of rows) {
        const content = typeof row[column] === 'string' ? JSON.parse(row[column]) : row[column]
        const cleaned = removeDecorativeFields(content)
        if (JSON.stringify(cleaned) !== JSON.stringify(content)) await DB.table(table).where('id', Number(row.id)).update({[column]: JSON.stringify(cleaned)})
      }
    }
  },
  async down() {},
})
