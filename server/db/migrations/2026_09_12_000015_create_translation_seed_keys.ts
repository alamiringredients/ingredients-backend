import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('translation_seed_keys', table => {
      table.id()
      table.string('translation_key').unique()
      table.timestamps()
    })
  },
  async down({schema}) {
    await schema.dropTable('translation_seed_keys')
  },
})
