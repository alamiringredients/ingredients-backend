import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('content_translations', t => {
      t.id()
      t.string('translation_key').unique()
      t.string('page').index()
      t.text('source')
      t.timestamps()
    })
    await schema.createTable('content_translation_values', t => {
      t.id()
      t.bigInteger('translation_id')
      t.string('locale')
      t.text('value')
      t.timestamps()
      t.unique(['translation_id', 'locale'], 'translation_locale_unique')
      t.foreign('translation_id').references('id').on('content_translations').onDelete('cascade')
    })
  },
  async down({schema}) {
    await schema.dropTable('content_translation_values')
    await schema.dropTable('content_translations')
  },
})
