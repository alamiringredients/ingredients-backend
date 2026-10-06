'use server'

import {adminActionError,redirectCreatedRecord} from '@/server/admin/form-actions'

import {randomUUID} from 'node:crypto'
import {assertAccessChange} from '@/server/admin/access-control'
import { normalizeRolePermissions, permissionsFromRows, rolePermissionRows } from '@/lib/admin/access'
import { requireAdminPermission } from '@/server/admin/authorization'
import {validate} from '@holo-js/forms'
import {createAdminForm,roleForm,updateAdminForm} from '@/app/admin/access-schema'
import Admin from '@/server/models/Admin'
import Role from '@/server/models/Role'
import {DB} from '@holo-js/db'
import { hashPassword } from '@holo-js/auth'
import { revalidatePath } from 'next/cache'


function validId(id: number) {
  if (!Number.isSafeInteger(id) || id < 0) throw new Error('Invalid record ID.')
}

function refreshAccessPages() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/admin/admins')
  revalidatePath('/admin/roles')
}

export async function saveRoleAction(id:number,payload:string) {
  try {
    validId(id)
    const actor = await requireAdminPermission('roles', id ? 'edit' : 'create')
    const submitted=JSON.parse(payload)
    const input=await validate(submitted,roleForm)
    const name=input.name,description=input.description?.trim()??''
    const permissions=normalizeRolePermissions(submitted.permissions)
    if(!Object.values(permissions).some(actions=>actions.length))return {ok:false,message:'Please correct the highlighted fields.',errors:{permissions:['Choose at least one permission.']}}
    await assertAccessChange(Number(actor.id), {roleId: id}, permissions)

    const duplicate = await Role.where('name', name).firstJson()
    if(duplicate&&Number(duplicate.id)!==id)return {ok:false,message:'Please correct the highlighted fields.',errors:{name:['A role with this name already exists.']}}
    const values = {name, description}
    let savedId = id
    await DB.transaction(async () => {
      if (id) {
        await (await Role.findOrFail(id)).update(values)
        await DB.table('role_permissions').where('role_id', id).delete()
      } else {
        const role = await Role.create(values)
        savedId = Number(role.get('id'))
      }
      await DB.table('role_permissions').insert(rolePermissionRows(savedId, permissions))
    })
    refreshAccessPages()
    await redirectCreatedRecord(id,savedId,'/admin/roles','roles')
    return {ok: true, message: 'Role saved.', id: savedId}
  } catch (error) {
    return adminActionError(error)
  }
}

export async function deleteRoleAction(id:number) {
  try {
    validId(id)
    const actor = await requireAdminPermission('roles', 'delete')
    await assertAccessChange(Number(actor.id), {roleId: id})
    if (await Admin.where('role_id', id).firstJson()) throw new Error('Reassign this role’s admins before deleting it.')
    await (await Role.findOrFail(id)).delete()
    refreshAccessPages()
    return {ok: true, message: 'Role deleted.'}
  } catch (error) {
    return adminActionError(error)
  }
}

export async function saveAdminAction(id:number,payload:string) {
  try {
    validId(id)
    const actor = await requireAdminPermission('admins', id ? 'edit' : 'create')
    const input=await validate(JSON.parse(payload),id?updateAdminForm:createAdminForm)
    const name=input.name,email=input.email,password=input.password??'',roleId=input.role_id
    const assignedRole = await Role.with('permissions').where('id',roleId).firstJson()
    if(!assignedRole)return {ok:false,message:'Please correct the highlighted fields.',errors:{role_id:['Choose an existing role.']}}
    await assertAccessChange(Number(actor.id), {adminId: id}, permissionsFromRows(assignedRole.permissions))
    const duplicate = await Admin.where('email', email).firstJson()
    if(duplicate&&Number(duplicate.id)!==id)return {ok:false,message:'Please correct the highlighted fields.',errors:{email:['An admin with this email already exists.']}}

    const values: Record<string, unknown> = {name, email, role_id: roleId}
    if (password) {
      values.password = await hashPassword(password)
      values.auth_version = randomUUID()
    }
    let savedId = id
    if (id) {
      await (await Admin.findOrFail(id)).update(values)
    } else {
      const admin = await Admin.create(values)
      savedId = Number(admin.get('id'))
    }
    refreshAccessPages()
    await redirectCreatedRecord(id,savedId,'/admin/admins','admins')
    return {ok: true, message: 'Admin saved.', id: savedId}
  } catch (error) {
    return adminActionError(error)
  }
}

export async function deleteAdminAction(id:number) {
  try {
    validId(id)
    const actor = await requireAdminPermission('admins', 'delete')
    if (Number(actor.id) === id) throw new Error('You cannot delete your own admin account.')
    await assertAccessChange(Number(actor.id), {adminId: id})
    const target = await Admin.findOrFail(id)
    if (target.get('role_id') == null) {
      const owners = (await Admin.getJson()).filter((admin) => admin.role_id == null)
      if (owners.length <= 1) throw new Error('The last owner account cannot be deleted.')
    }
    await target.delete()
    refreshAccessPages()
    return {ok: true, message: 'Admin deleted.'}
  } catch (error) {
    return adminActionError(error)
  }
}
