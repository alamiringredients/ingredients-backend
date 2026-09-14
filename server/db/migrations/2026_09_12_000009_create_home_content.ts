import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('home_sections', (table) => {
      table.id()
      table.string('section_key').unique()
      table.string('label')
      table.boolean('enabled').default(true)
      table.integer('sort_order').default(0)
      table.json('content')
      table.timestamps()
    })

    await schema.createTable('website_settings', (table) => {
      table.id()
      table.string('setting_key').unique()
      table.json('value')
      table.timestamps()
    })
  },
  async down({schema}) {
    await schema.dropTable('website_settings')
    await schema.dropTable('home_sections')
  },
})
