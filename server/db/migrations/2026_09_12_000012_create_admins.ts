import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    await schema.createTable('roles', (table) => {
      table.id()
      table.string('name').unique()
      table.text('description').nullable()
      table.json('permissions')
      table.timestamps()
    })

    await schema.createTable('admins', (table) => {
      table.id()
      table.string('name')
      table.string('email').unique()
      table.string('password')
      table.bigInteger('role_id').nullable()
      table.foreign('role_id').references('id').on('roles').onDelete('set null')
      table.timestamps()
    })
  },
  async down({schema}) {
    await schema.dropTable('admins')
    await schema.dropTable('roles')
  },
})
