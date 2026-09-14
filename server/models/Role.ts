import {defineModel, hasMany} from '@holo-js/db'
export default defineModel('roles', {
    relations: {admins: hasMany('Admin', 'role_id')},
    fillable: ['name', 'description', 'permissions'],
})
