import {defineModel} from '@holo-js/db'

export default defineModel('role_permissions', {
  fillable: ['role_id', 'resource', 'action'],
})
