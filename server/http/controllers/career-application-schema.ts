import {field, schema} from '@holo-js/forms/schema'

const locales = ['en', 'ar', 'fr'] as const

export const careerApplicationForm = schema({
  name: field.string().required('invalid').max(150, 'invalid').transform(value => value.trim()),
  email: field.string().required('invalid').email('invalid').max(200, 'invalid').transform(value => value.trim().toLowerCase()),
  phone: field.string().required('invalid').max(50, 'invalid').transform(value => value.trim()),
  department: field.string().max(150, 'invalid').transform(value => value.trim()).optional(),
  letter: field.string().max(10000, 'invalid').optional(),
  consent: field.boolean().required('invalid').custom(value => value === true, 'invalid'),
  locale: field.string().required('invalid').in(locales, 'invalid'),
  key: field.string().required('invalid').uuid('invalid'),
  jobId: field.number().integer('invalid').min(1, 'invalid').optional(),
  cv: field.file().required('file').custom(file => {
    const extension = file.name?.toLowerCase().split('.').at(-1)
    const mime = extension === 'pdf' ? 'application/pdf' : extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : null
    return file.size > 0 && Boolean(mime) && (!file.type || file.type === 'application/octet-stream' || file.type === mime)
  }, 'file').maxSize('10mb', 'file'),
  website: field.string().max(200, 'invalid').optional(),
})
