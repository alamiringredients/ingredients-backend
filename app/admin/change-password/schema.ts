import {field, schema} from '@holo-js/forms/schema'

export const changePasswordForm=schema({
  currentPassword:field.password().required('Enter your current password.').max(1024),
  password:field.password().required('Enter a new password.').min(8,'Use at least 8 characters.').max(128),
  passwordConfirmation:field.password().required('Confirm your new password.').min(8).max(128),
})
