import {defineModel, hasMany} from '@holo-js/db'
import './RolePermission'
export default defineModel('roles', {
    relations: {admins: hasMany('Admin', 'role_id'), permissions: hasMany('RolePermission', 'role_id')},
    fillable: ['name', 'description'],
})
