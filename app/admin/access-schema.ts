import {field, schema} from '@holo-js/forms/schema'

export const roleForm=schema({
  name:field.string().required('Enter a name.').min(2).max(80).transform(value=>value.trim()),
  description:field.string().max(500).optional(),
})

export const createAdminForm=schema({
  name:field.string().required('Enter a name.').min(2).max(100).transform(value=>value.trim()),
  email:field.string().required('Enter an email address.').email('Enter a valid email address.').max(190).transform(value=>value.trim().toLowerCase()),
  password:field.password().required('Enter a password.').min(8,'Use at least 8 characters.'),
  role_id:field.number().required('Choose a role.').integer().min(1),
})

export const updateAdminForm=schema({
  name:field.string().required('Enter a name.').min(2).max(100).transform(value=>value.trim()),
  email:field.string().required('Enter an email address.').email('Enter a valid email address.').max(190).transform(value=>value.trim().toLowerCase()),
  password:field.password().optional().custom(value=>!value||value.length>=8,'Use at least 8 characters.'),
  role_id:field.number().required('Choose a role.').integer().min(1),
})
