import {field, schema} from '@holo-js/forms/schema'

export const loginForm = schema({
  email: field.string().required().email(),
  password: field.password().required(),
  remember: field.boolean().default(false),
})

export const logoutForm = schema({guard: field.string().default('admin').in(['admin'])})
