import {belongsTo, defineModel} from '@holo-js/db'

export default defineModel('admins', {
  relations: {role: belongsTo('Role', 'role_id')},
  fillable: ['name', 'email', 'password', 'role_id', 'auth_version'],
  hidden: ['password'],
})
