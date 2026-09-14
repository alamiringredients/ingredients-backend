import {field, schema} from '@holo-js/forms/schema'

export const saveCmsPayload = schema({
  key: field.string().required('A content key is required.'),
  payload: field.string().required('Content is required.'),
})

export const uploadCmsFile = schema({
  ownerType: field.string().required('A media owner type is required.'),
  ownerKey: field.string().required('A media owner key is required.'),
  conversion: field.string().required('An image conversion is required.'),
  file: field.file().required('Choose a file to upload.').maxSize('100mb', 'Files must be smaller than 100 MB.'),
})
