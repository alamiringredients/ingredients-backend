import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('certification_types', t => {
      t.id(); t.string('slug').unique(); t.string('seed_key').nullable().unique(); t.string('kind'); t.string('logo'); t.string('badge'); t.timestamps()
    })
    await schema.createTable('certification_type_translations', t => {
      t.id(); t.bigInteger('type_id'); t.string('locale'); t.string('name'); t.text('description')
      t.unique(['type_id', 'locale'], 'certification_type_locale_unique')
      t.foreign('type_id').references('id').on('certification_types').onDelete('cascade')
    })
    await schema.createTable('certifications', t => {
      t.id(); t.bigInteger('type_id'); t.string('seed_key').nullable().unique(); t.string('holder'); t.string('status')
      t.boolean('published').default(false); t.integer('sort_order').default(0)
      t.date('target_date').nullable(); t.date('issue_date').nullable(); t.date('expiry_date').nullable(); t.string('certificate_number'); t.string('document'); t.timestamps()
      t.unique(['type_id', 'holder']); t.index(['published', 'sort_order', 'id']); t.index(['status', 'expiry_date'])
      t.foreign('type_id').references('id').on('certification_types').onDelete('restrict')
    })
    await schema.createTable('certification_translations', t => {
      t.id(); t.bigInteger('certification_id'); t.string('locale'); t.text('scope')
      t.unique(['certification_id', 'locale'], 'certification_locale_unique')
      t.foreign('certification_id').references('id').on('certifications').onDelete('cascade')
    })
  },
  async down({schema}) {
    for (const table of ['certification_translations', 'certifications', 'certification_type_translations', 'certification_types']) await schema.dropTable(table)
  },
})
